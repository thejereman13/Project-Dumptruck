module user;

import vibe.vibe;
import std.uuid;
import std.stdio;
import std.algorithm;
import std.array;

import DB = database;


struct User {
    UUID clientID;
    string name;
    int role;
}

final class UserList {
    private User[UUID] roomUsers;
    private shared bool[UUID] roomUserStatus;
    private long roomID;
    
    public UUID[] adminUsers;

    public int userCount = 0;

    public this(long roomID) {
        this.roomID = roomID;
    }

    @property public User[] getUserList() {
        return roomUsers.values;
    }

    public UUID addUser(UUID clientID) {
        const id = clientID.empty ? randomUUID() : clientID;
        const user = getSiteUser(clientID);
        const name = clientID.empty || user.id.empty ? "Guest-" ~ id.toString() : user.name;
        roomUsers[id] = User(id, name, 1);
        roomUserStatus[id] = true;
        if (!clientID.empty) {
            addRecentRoomToUser(clientID, roomID);
        }
        userCount++;
        return id;
    }

    public bool removeUser(UUID id) {
        if (roomUsers.remove(id) && roomUserStatus.remove(id)) {
            userCount--;
            return true;
        }
        return false;
    }

    public bool activeUser(UUID id) {
        return id in roomUsers && id in roomUserStatus;
    }
    public void setUserActive(UUID id) {
        roomUserStatus[id] = true;
    }

    public bool updateUserStatus() {
        bool didRemove = false;
        foreach (User u; roomUsers) {
            if (u.clientID in roomUserStatus) {
                if (!roomUserStatus[u.clientID]) {
                    writeln("Lost User ", u.clientID);
                    removeUser(u.clientID);
                    didRemove = true;
                }
                roomUserStatus[u.clientID] = false;
            }
        }
        return didRemove;
    }
}

struct SiteUser {
    UUID id;
    string googleID;
    string name;
    string email;
    long[] recentRooms;
}

private SiteUser constructSiteUser(Json data) {
    if (data["googleID"].type() != Json.Type.undefined) {
        return SiteUser(
            UUID(data["id"].get!string),
            data["googleID"].get!string,
            data["name"].get!string,
            data["email"].get!string,
            data["recentRooms"].get!(Json[]).map!(j => j.get!long).array
        );
    }
    return SiteUser.init;
}

SiteUser makeSiteUser(string googleID, string name, string email) {
    const UUID foundID = DB.findGIDUser(googleID);
    if (!foundID.empty) {
        Json data = parseJsonString(DB.getUserData(foundID));
        auto su = constructSiteUser(data);
        if (!su.id.empty) return su;
    }
    SiteUser newUser = SiteUser(randomUUID(), googleID, name, email, []);
    DB.setUserData(newUser.id, serializeToJsonString(newUser));
    DB.setUserGID(newUser.id, googleID);
    return newUser;
}

void addRecentRoomToUser(UUID clientID, long roomID) {
    Json data = parseJsonString(DB.getUserData(clientID));
    if (data["googleID"].type() != Json.Type.undefined) {
        long[] recentRooms = data["recentRooms"].get!(Json[]).map!(j => j.get!long).array;
        if (!recentRooms.any!(r => r == roomID)) {
            recentRooms ~= roomID;
            data["recentRooms"] = serializeToJson(recentRooms);
            DB.setUserData(clientID, data.toString());
        }
    }
}

SiteUser getSiteUser(UUID clientID) {
    if (clientID.empty) return SiteUser.init;
    Json data = parseJsonString(DB.getUserData(clientID));
    return constructSiteUser(data);
}

void getUserInfo(HTTPServerRequest req, HTTPServerResponse res) {
    if (req.session && req.session.isKeySet("clientID")) {
        auto id = req.session.get!UUID("clientID");
        Json data = parseJsonString(DB.getUserData(id));
        res.writeJsonBody(data, 201, false);
        return;
    }
    res.writeJsonBody("{}", 400, false);
}

void getPublicUserInfo(HTTPServerRequest req, HTTPServerResponse res) {
    const UUID userID = UUID(req.params["id"].to!string);

    if (!userID.empty) {
        SiteUser u = constructSiteUser(parseJsonString(DB.getUserData(userID)));
        if (!u.id.empty) {
            // Remove sensitive Information
            u.googleID = "";
            u.email = "";
            res.writeJsonBody(serializeToJson(u), 201, false);
            return;
        }
    }
    res.writeJsonBody("{}", 400, false);
}

