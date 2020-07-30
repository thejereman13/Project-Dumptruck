module user;

import std.uuid;
import std.stdio;


struct User {
    UUID id;
    string name;
    int role;
}

final class UserList {
    private User[UUID] roomUsers;
    private shared bool[UUID] roomUserStatus;

    @property public User[] getUserList() {
        return roomUsers.values;
    }
    alias getUserList this;

    public UUID addGuestUser() {
        const id = randomUUID();
        roomUsers[id] = User(id, "Guest-" ~ id.toString(), 1);
        roomUserStatus[id] = true;
        return id;
    }

    public bool removeUser(UUID id) {
        return roomUsers.remove(id) && roomUserStatus.remove(id);
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
            if (u.id in roomUserStatus) {
                if (!roomUserStatus[u.id]) {
                    writeln("Lost User ", u.id);
                    removeUser(u.id);
                    didRemove = true;
                }
                roomUserStatus[u.id] = false;
            }
        }
        return didRemove;
    }
}