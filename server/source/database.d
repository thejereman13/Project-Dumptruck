module database;

import mysql;
import std.uuid;
import std.stdio;
import std.array;
import std.conv;
import std.algorithm;
import vibe.core.log;
import vibe.vibe;
import vibe.core.connectionpool;

MySQLPool dbPool;

void initializeDBConnection() {
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

bool addUser(string username, string password, int role) {
    return true;
}

bool deleteUser(string username) {
    return true;
}

bool authenticateUser(string user, string password) {
    return true;
}

string getUserData(UUID userID) {
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

void setUserData(UUID user, string data) {
    LockedConnection!Connection conn;
    try {
        conn = dbPool.lockConnection();
    } catch (Exception e) {
        logError(e.message);
        return;
    }
    conn.query("SELECT SetUserData (?, ?)", user.toString(), data).front;
}

bool clearUserData(UUID user) {
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

UUID findGIDUser(string gid) {
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

void setUserGID(UUID user, string gid) {
    LockedConnection!Connection conn;
    try {
        conn = dbPool.lockConnection();
    } catch (Exception e) {
        logError(e.message);
        return;
    }
    conn.exec("UPDATE Users SET GID = (?) WHERE UserID = (?)", gid, user.toString());
}

struct DBRoomSettings {
    string name;
    int trim; // trim the ending of the video in seconds (positive shortens, negative will add time)
    bool guestControls; // default false
    bool publicVisibility; // default true
    bool hifiTiming; // default false

    static DBRoomSettings defaultSettings() {
        return DBRoomSettings("", 0, false, true, false);
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
            default: break;
        }
    }
    return room;
}

DBRoomInfo peekRoomInformation(long roomID) {
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

DBRoomInfo getRoomInformation(long roomID, UUID user) {
    DBRoomInfo roomInfo = peekRoomInformation(roomID);
    //  If the room has no admins, it's assumed to be a new one
    if (roomInfo.admins.length == 0) {
        LockedConnection!Connection conn;
        try {
            conn = dbPool.lockConnection();
        } catch (Exception e) {
            logError(e.message);
            return DBRoomInfo.init;
        }
        DBRoomSettings roomSettings = DBRoomSettings("Room " ~ roomID.to!string, 0, false, true);
        conn.exec("UPDATE Rooms SET RoomSettings = (?) WHERE RoomID = (?)", serializeToJsonString(roomSettings), roomID);
        // UUID[] adminList = [];
        // if (!user.empty) {
        //     writeln("Setting the Admin for an empty Room: ", roomID);
        //     conn.exec("DELETE FROM RoomAdmins WHERE RoomID = (?)", roomID);
        //     conn.exec("INSERT INTO RoomAdmins (RoomID, AdminUUID, Role) VALUES (?, ?, ?)", roomID, user.toString(), 0);
        //     adminList ~= user;
        // }
        return DBRoomInfo(roomID, roomSettings);
    } else {
        return roomInfo;
    }
}

DBRoomSettings setRoomSettings(long roomID, Json settings) {
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

void setRoomAdmins(long roomID, UUID[] admins) {
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
