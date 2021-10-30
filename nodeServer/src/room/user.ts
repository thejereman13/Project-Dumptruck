import { v4 as randomUUID } from "uuid";
import { getSiteUser, addRecentRoomToUser } from "../site_user";

export interface User {
    clientID: string;
    name: string;
    userCount: number;
}

export class UserList {
    private roomUsers: Record<string, User> = {};
    private roomUsersReady: Record<string, boolean> = {};
    private roomUsersErrored: Record<string, boolean> = {};
    private roomID = 0;

    public adminUsers: string[] = [];

    public userCount = 0;

    public constructor(roomID: number) {
        this.roomID = roomID;
    }

    public getUserList(): User[] {
        return Object.values(this.roomUsers);
    }

    public async addUser(clientID: string): Promise<string> {
        const id = !clientID ? randomUUID() : clientID;
        const user = await getSiteUser(clientID);
        const name = user ? user.name : "Guest-" + id;
        if (id in this.roomUsers)
            this.roomUsers[id].userCount++;
        else
            this.roomUsers[id] = {
                clientID: id,
                name,
                userCount: user ? 1 : 0
            };
        if (clientID) {
            addRecentRoomToUser(clientID, this.roomID);
        }
        this.userCount++;
        return id;
    }

    public removeUser(id: string): boolean {
        if (id in this.roomUsers && this.roomUsers[id].userCount > 1) {
            this.roomUsers[id].userCount--;
            this.userCount--;
            return false;
        }
        if (id in this.roomUsers) {
            delete this.roomUsers[id];
            this.userCount--;
            return true;
        }
        return false;
    }

    public activeUser(id: string): boolean {
        return id in this.roomUsers;
    }

    public removeAdmin(id: string): void {
        const index = this.adminUsers.indexOf(id);
        if (index >= 0)
            this.adminUsers.splice(index, 1);
    }
    public addAdmin(id: string): void {
        if (!this.adminUsers.includes(id))
            this.adminUsers.push(id);
    }

    public clearTempUserLists(): void {
        this.roomUsersReady = {};
        this.roomUsersErrored = {};
    }

    public setUserErrored(id: string): number {
        this.roomUsersErrored[id] = true;
        if (Object.keys(this.roomUsers).length > 0)
            return Object.keys(this.roomUsersErrored).length / Object.keys(this.roomUsers).length;
        else return 0;
    }
    public setUserReady(id: string): number {
        this.roomUsersReady[id] = true;
        if (Object.keys(this.roomUsers).length > 0)
            return Object.keys(this.roomUsersReady).length / Object.keys(this.roomUsers).length;
        else return 1;
    }
}
