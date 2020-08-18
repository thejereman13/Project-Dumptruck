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

struct DBRoomInfo {
    long roomID;
    string roomName;
    UUID[] admins;
}

DBRoomInfo getRoomInformation(long roomID, UUID user) {
    LockedConnection!Connection conn;
    try {
        conn = dbPool.lockConnection();
    } catch (Exception e) {
        logError(e.message);
        return DBRoomInfo.init;
    }
    Row res = conn.query("SELECT GetRoom (?)", roomID).front;
    string roomName = res[0].get!string;
    if (roomName.length > 0) {
        Row[] ads = conn.query("SELECT * FROM RoomAdmins WHERE RoomID = (?)", roomID).array;
        return DBRoomInfo(roomID, roomName, ads.map!(ad => UUID(ad[1].get!string)).array);
    } else {
        roomName = "Room " ~ roomID.to!string;
        conn.exec("UPDATE Rooms SET RoomName = (?) WHERE RoomID = (?)", roomName, roomID);
        UUID[] adminList = [];
        if (!user.empty) {
            conn.exec("INSERT INTO RoomAdmins (RoomID, AdminUUID, Role) VALUES (?, ?, ?)", roomID, user.toString(), 0);
            adminList ~= user;
        }
        return DBRoomInfo(roomID, roomName);
    }
}

void setRoomName(long roomID, string roomName) {
    LockedConnection!Connection conn;
    try {
        conn = dbPool.lockConnection();
    } catch (Exception e) {
        logError(e.message);
        return;
    }
    conn.exec("UPDATE Rooms SET RoomName = (?) WHERE RoomID = (?)", roomName, roomID);
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
        conn.exec("INSERT INTO RoomAdmins (RoomID, AdminUUID, Role) VALUES (?, ?, ?)", roomID, ad.toString(), 0);
    }
}

