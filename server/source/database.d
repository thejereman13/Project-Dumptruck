module database;

import mysql;
import tinyredis;
import std.uuid;
import std.stdio;
import std.array;
import std.conv;
import std.algorithm;
import vibe.core.log;
import vibe.vibe;
import vibe.core.connectionpool;

version(mysql)
MySQLPool dbPool;

version(redis)
    Redis redis;

void initializeDBConnection() {
    version(mysql) {
        import Config = configuration;
        string connectionStr = format!"host=localhost;port=3306;user=%s;pwd=%s;db=%s"(
            Config.server_configuration["database_username"].get!string,
            Config.server_configuration["database_password"].get!string,
            Config.server_configuration["database_name"].get!string);
        try {
            dbPool = new MySQLPool(connectionStr);
        } catch (Exception e) {
            logError(e.message);
            dbPool = null;
            return;
        }
    }
    version(redis) {
        redis = new Redis();
    }
}

string getUserData(UUID userID) {
    version(mysql) {
        LockedConnection!Connection conn;
        try {
            conn = dbPool.lockConnection();
        } catch (Exception e) {
            logError(e.message);
            return "";
        }

        Row res = conn.query("SELECT GetUserData (?)", userID.toString()).front;
        return res[0].get!string;
    }
    version(redis) {
        Response r = redis.send("HGET", "user:"~userID.toString(), "data");
        if (r.value.length > 0)
            return r.value;
        else
            return "{}";
    }
}

void setUserData(UUID user, string data) {
    version(mysql) {
        LockedConnection!Connection conn;
        try {
            conn = dbPool.lockConnection();
        } catch (Exception e) {
            logError(e.message);
            return;
        }
        conn.query("SELECT SetUserData (?, ?)", user.toString(), data).front;
    }
    version(redis) {
        redis.send("HMSET", "user:"~user.toString(), "data", data);
    }
}

bool clearUserData(UUID user) {
    version(mysql) {
        LockedConnection!Connection conn;
        try {
            conn = dbPool.lockConnection();
        } catch (Exception e) {
            logError(e.message);
            return false;
        }
        conn.exec("DELETE FROM Users WHERE UserID = (?)", user.toString());
        conn.exec("DELETE FROM RoomAdmins WHERE AdminUUID = (?)", user.toString());
        return true;
    }
    version(redis) {
        redis.send("DEL", "user:"~user.toString());
        Response r = redis.send("LRANGE", "userAdmins:"~user.toString(), "0", "-1");
        foreach(k; r) {
            redis.send("LREM", "roomAdmins:"~k.value, "0", user.toString());
        }
        return true;
    }
}

UUID findGIDUser(string gid) {
    version(mysql) {
        LockedConnection!Connection conn;
        try {
            conn = dbPool.lockConnection();
        } catch (Exception e) {
            logError(e.message);
            return UUID.init;
        }
        Row res = conn.query("SELECT FindGIDUser (?)", gid).front;
        if (res.length > 0 && res[0].get!string.length > 0) return UUID(res[0].get!string);
        return UUID.init;
    }
    version(redis) {
        Response r = redis.send("GET", "gid:"~gid);
        if (r.value.length > 0)
            return UUID(r.value);
        return UUID.init;
    }
}

void setUserGID(UUID user, string gid) {
    version(mysql) {
        LockedConnection!Connection conn;
        try {
            conn = dbPool.lockConnection();
        } catch (Exception e) {
            logError(e.message);
            return;
        }
        conn.exec("UPDATE Users SET GID = (?) WHERE UserID = (?)", gid, user.toString());
    }
    version(redis) {
        redis.send("HMSET", "user:"~user.toString(), "gid", gid);
        redis.send("SET", "gid:"~gid, user.toString());
    }
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
    version(mysql) {
        LockedConnection!Connection conn;
        try {
            conn = dbPool.lockConnection();
        } catch (Exception e) {
            logError(e.message);
            return DBRoomInfo.init;
        }
        Row res = conn.query("SELECT GetRoom (?)", roomID).front;
        DBRoomSettings roomSettings = parseRoomSettings(parseJsonString(res[0].get!string));
        if (roomSettings.name.length > 0) {
            Row[] ads = conn.query("SELECT * FROM RoomAdmins WHERE RoomID = (?)", roomID).array;
            return DBRoomInfo(roomID, roomSettings, ads.map!(ad => UUID(ad[1].get!string)).array);
        } else {
            return DBRoomInfo(roomID, roomSettings);
        }
    }
    version(redis) {
        Response r = redis.send("GET", "room:"~roomID.to!string);
        DBRoomSettings roomSettings = parseRoomSettings(parseJsonString(r.value.length > 0 ? r.value : "{}"));
        if (roomSettings.name.length > 0) {
            r = redis.send("LRANGE", "roomAdmins:"~roomID.to!string, "0", "-1");
            return DBRoomInfo(roomID, roomSettings, r.map!((Response s) => UUID(s.value)).array);
        } else {
            return DBRoomInfo(roomID, roomSettings);
        }
    }
}

DBRoomInfo getRoomInformation(long roomID, UUID user) {
    DBRoomInfo roomInfo = peekRoomInformation(roomID);
    //  If the room has no admins, it's assumed to be a new one
    if (roomInfo.admins.length == 0) {
        version(mysql) {
            LockedConnection!Connection conn;
            try {
                conn = dbPool.lockConnection();
            } catch (Exception e) {
                logError(e.message);
                return DBRoomInfo.init;
            }
            DBRoomSettings roomSettings = DBRoomSettings("Room " ~ roomID.to!string, 0, false, true);
            conn.exec("UPDATE Rooms SET RoomSettings = (?) WHERE RoomID = (?)", serializeToJsonString(roomSettings), roomID);
            return DBRoomInfo(roomID, roomSettings);
        }
        version(redis) {
            DBRoomSettings roomSettings = DBRoomSettings("Room " ~ roomID.to!string, 0, false, true);
            redis.send("SET", "room:"~roomID.to!string, serializeToJsonString(roomSettings));
            return DBRoomInfo(roomID, roomSettings);
        }
    } else {
        return roomInfo;
    }
}

DBRoomSettings setRoomSettings(long roomID, Json settings) {
    version(mysql) {
        LockedConnection!Connection conn;
        try {
            conn = dbPool.lockConnection();
        } catch (Exception e) {
            logError(e.message);
            return DBRoomSettings.init;
        }
        const roomSettings = parseRoomSettings(settings);
        if (roomSettings.name.length > 0)
            conn.exec("UPDATE Rooms SET RoomSettings = (?) WHERE RoomID = (?)", serializeToJsonString(roomSettings), roomID);
        return roomSettings;
    }
    version(redis) {
        const roomSettings = parseRoomSettings(settings);
        if (roomSettings.name.length > 0)
            redis.send("SET", "room:"~roomID.to!string, serializeToJsonString(roomSettings));
        return roomSettings;
    }
}

void setRoomAdmins(long roomID, UUID[] admins) {
    version(mysql) {
        LockedConnection!Connection conn;
        try {
            conn = dbPool.lockConnection();
        } catch (Exception e) {
            logError(e.message);
            return;
        }
        conn.exec("DELETE FROM RoomAdmins WHERE RoomID = (?)", roomID);
        foreach(UUID ad; admins) {
            if (!ad.empty)
                conn.exec("INSERT INTO RoomAdmins (RoomID, AdminUUID, Role) VALUES (?, ?, ?)", roomID, ad.toString(), 0);
        }
    }
    version(redis) {
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
}
