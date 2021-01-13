module database;

import tinyredis;
import std.uuid;
import std.stdio;
import std.array;
import std.conv;
import std.algorithm;
import vibe.core.log;
import vibe.vibe;
import vibe.core.connectionpool;

Redis redis;

void initializeDBConnection() {
    redis = new Redis();
}

string getUserData(UUID userID) {
    Response r = redis.send("HGET", "user:"~userID.toString(), "data");
    if (r.value.length > 0)
        return r.value;
    else
        return "{}";
}

void setUserData(UUID user, string data) {
    redis.send("HMSET", "user:"~user.toString(), "data", data);
}

bool clearUserData(UUID user) {
    redis.send("DEL", "user:"~user.toString());
    Response r = redis.send("LRANGE", "userAdmins:"~user.toString(), "0", "-1");
    foreach(k; r) {
        redis.send("LREM", "roomAdmins:"~k.value, "0", user.toString());
    }
    return true;
}

UUID findGIDUser(string gid) {
    Response r = redis.send("GET", "gid:"~gid);
    if (r.value.length > 0)
        return UUID(r.value);
    return UUID.init;
}

void setUserGID(UUID user, string gid) {
    redis.send("HMSET", "user:"~user.toString(), "gid", gid);
    redis.send("SET", "gid:"~gid, user.toString());
}

struct DBRoomSettings {
    string name;
    int trim; // trim the ending of the video in seconds (positive shortens, negative will add time)
    bool guestControls; // default false
    bool publicVisibility; // default true
    bool hifiTiming; // default false (disabled for 32 or more users)
    bool skipErrors; // default true
    bool waitUsers; // default false

    static DBRoomSettings defaultSettings() {
        return DBRoomSettings("", 0, false, true, false, true, false);
    }
}

struct DBRoomInfo {
    long roomID;
    DBRoomSettings settings;
    UUID[] admins;
}

DBRoomSettings parseRoomSettings(Json settings) {
    DBRoomSettings room = DBRoomSettings.defaultSettings();
    foreach (string key, Json value; settings.byKeyValue) {
        switch (key) {
            case "name":
                room.name = value.get!string;
                break;
            case "trim":
                room.trim = value.get!int;
                break;
            case "guestControls":
                room.guestControls = value.get!bool;
                break;
            case "publicVisibility":
                room.publicVisibility = value.get!bool;
                break;
            case "hifiTiming":
                room.hifiTiming = value.get!bool;
                break;
            case "skipErrors":
                room.skipErrors = value.get!bool;
                break;
            case "waitUsers":
                room.waitUsers = value.get!bool;
                break;
            default: break;
        }
    }
    return room;
}

DBRoomInfo peekRoomInformation(long roomID) {
    Response r = redis.send("GET", "room:"~roomID.to!string);
    DBRoomSettings roomSettings = parseRoomSettings(parseJsonString(r.value.length > 0 ? r.value : "{}"));
    if (roomSettings.name.length > 0) {
        r = redis.send("LRANGE", "roomAdmins:"~roomID.to!string, "0", "-1");
        return DBRoomInfo(roomID, roomSettings, r.map!((Response s) => UUID(s.value)).array);
    } else {
        return DBRoomInfo(roomID, roomSettings);
    }
}

DBRoomInfo getRoomInformation(long roomID, UUID user) {
    DBRoomInfo roomInfo = peekRoomInformation(roomID);
    //  If the room has no admins, it's assumed to be a new one
    if (roomInfo.admins.length == 0) {
        DBRoomSettings roomSettings = DBRoomSettings("Room " ~ roomID.to!string, 0, false, true);
        redis.send("SET", "room:"~roomID.to!string, serializeToJsonString(roomSettings));
        return DBRoomInfo(roomID, roomSettings);
    } else {
        return roomInfo;
    }
}

DBRoomSettings setRoomSettings(long roomID, Json settings) {
    const roomSettings = parseRoomSettings(settings);
    if (roomSettings.name.length > 0)
        redis.send("SET", "room:"~roomID.to!string, serializeToJsonString(roomSettings));
    return roomSettings;
}

void setRoomAdmins(long roomID, UUID[] admins) {
    Response r = redis.send("LRANGE", "roomAdmins:"~roomID.to!string, "0", "-1");
    if (!r.empty())
        foreach(k; r) {
            // remove room from a user's list of adminable rooms
            redis.send("LREM", "userAdmins:"~k.value, "0", roomID.to!string);
        }

    redis.send("DEL", "roomAdmins:"~roomID.to!string);
    foreach(UUID ad; admins) {
        if (!ad.empty) {
            redis.send("LPUSH", "roomAdmins:"~roomID.to!string, ad.toString());
            redis.send("LPUSH", "userAdmins:"~ad.toString(), roomID.to!string);
        }
    }
}
