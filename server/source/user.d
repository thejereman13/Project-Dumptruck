module user;

import vibe.vibe;
import std.uuid;
import std.stdio;
import std.algorithm;


struct User {
    UUID clientID;
    string name;
    int role;
}

final class UserList {
    private User[UUID] roomUsers;
    private shared bool[UUID] roomUserStatus;
    private long roomID;
    
    public int userCount = 0;

    public this(long roomID) {
        this.roomID = roomID;
    }

    @property public User[] getUserList() {
        return roomUsers.values;
    }

    public UUID addUser(UUID clientID) {
        const id = clientID.empty ? randomUUID() : clientID;
        const name = clientID.empty ? "Guest-" ~ id.toString() : getSiteUser(clientID).name;
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

//Not yet a database
private SiteUser[UUID] siteUserList;

SiteUser makeSiteUser(string googleID, string name, string email) {
    foreach(u; siteUserList) {
        if (u.googleID == googleID) {
            return u;
        }
    }
    SiteUser newUser = SiteUser(randomUUID(), googleID, name, email, []);
    siteUserList[newUser.id] = newUser;
    return newUser;
}

void addRecentRoomToUser(UUID clientID, long roomID) {
    if (clientID in siteUserList) {
        auto u = &siteUserList[clientID];
        if (!u.recentRooms.any!(r => r == roomID)) {
            u.recentRooms ~= roomID;
        }
        return;
    }
}

SiteUser getSiteUser(UUID clientID) {
    return siteUserList[clientID];
}

void getUserInfo(HTTPServerRequest req, HTTPServerResponse res) {
    if (req.session && req.session.isKeySet("clientID")) {
        auto id = req.session.get!UUID("clientID");
        if (id in siteUserList) {
            res.writeJsonBody(serializeToJson(siteUserList[id]), 201, false);
            return;
        }
    }
    res.writeJsonBody("{}", 400, false);
}

