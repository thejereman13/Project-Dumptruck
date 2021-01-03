module user;

import vibe.vibe;
import std.uuid;
import std.stdio;
import std.algorithm;
import std.array;

import site_user;

struct User {
    UUID clientID;
    string name;
    int role;
    int userCount;
}

final class UserList {
    private User[UUID] roomUsers;
    private bool[UUID] roomUserStatus;
    private bool[UUID] roomUsersReady;
    private bool[UUID] roomUsersErrored;
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
        const guest = clientID.empty || user.id.empty;
        const name = guest ? "Guest-" ~ id.toString() : user.name;
        if (id in roomUsers)
            roomUsers[id].userCount++;
        else
            roomUsers[id] = User(id, name, 1, guest ? 0 : 1);
            //  Defaulting each user's role to 1
        roomUserStatus[id] = true;
        if (!clientID.empty) {
            addRecentRoomToUser(clientID, roomID);
        }
        userCount++;
        return id;
    }

    public bool removeUser(UUID id) {
        if (id in roomUsers && roomUsers[id].userCount > 1) {
            roomUsers[id].userCount--;
            userCount--;
            return false;
        }
        if (roomUsers.remove(id) && roomUserStatus.remove(id)) {
            userCount--;
            return true;
        }
        return false;
    }

    public @trusted nothrow bool activeUser(UUID id) {
        return id in roomUsers && id in roomUserStatus;
    }
    public void setUserActive(UUID id) {
        roomUserStatus[id] = true;
    }

    public UUID[] updateUserStatus() {
        UUID[] removed;
        foreach (User u; roomUsers) {
            if (u.clientID in roomUserStatus) {
                if (!roomUserStatus[u.clientID]) {
                    removeUser(u.clientID);
                    removed ~= u.clientID;
                }
                roomUserStatus[u.clientID] = false;
            }
        }
        return removed;
    }

    public void removeAdmin(UUID id) {
        const index = adminUsers.countUntil!(u => u == id);
        if (index >= 0)
            adminUsers = adminUsers.remove(index);
    }
    public void addAdmin(UUID id) {
        if (!adminUsers.any!(a => a == id))
            adminUsers ~= id;
    }

    public @trusted nothrow void clearTempUserLists() {
        roomUsersReady.clear();
        roomUsersErrored.clear();
    }

    public float setUserErrored(UUID id) {
        roomUsersErrored[id] = true;
        if (roomUsers.length > 0)
            return cast(float)roomUsersErrored.length / roomUsers.length;
        else return 0;
    }
    public float setUserReady(UUID id) {
        roomUsersReady[id] = true;
        if (roomUsers.length > 0)
            return cast(float)roomUsersReady.length / roomUsers.length;
        else return 1;
    }
}
