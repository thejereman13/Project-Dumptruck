import WebSocket from "ws";
export interface Message {
    message: any;
    targets: string[];
}

export enum MessageType {
    Sync = "sync", // Server synchronizing connected clients
    Error = "error", // Server responding with an error code
    Ping = "ping", // Client updating connection status
    UserJoin = "userJoined", // Client joining the room
    UserLeft = "userLeft", // Client leaving the room
    UserList = "userList", // Server updating clients with the current list
    UserReady = "userReady", // Client has loaded the next video
    UserError = "userError", // Client has encountered a playback error
    Play = "play", // Server starting playback, Client requesting playback
    Pause = "pause", // Server pausing playback, Client requesting pause
    Skip = "skip", // Client requesting the next video
    Video = "video", // Server setting the active Client video
    Init = "init", // Server sending all initialization info
    Room = "room", // Server sending all room information
    QueueAdd = "addQueue", // Client adding a video id to queue
    QueueMultiple = "allQueue", // Client adding multiple videos
    QueueRemove = "removeQueue", // Client removing a video id from queue
    QueueClear = "clearQueue", // Client removing all of a users' videos
    QueueOrder = "orderQueue", // Server updating the client playlist
    QueueReorder = "reorderQueue", // Client reordering a users' videos
    UserOrder = "userQueue", // Server updating the room user queue order
    RoomSettings = "settings", // Admin updating the room settings
    AdminAdd = "addAdmin", // Admin adding another admin
    AdminRemove = "removeAdmin" // Admin removing another admin
}

export class MessageQueue {

    private clientSockets: Record<string, WebSocket[]> = {};

    private emitMessage(ms: Message) {
        if (ms.targets.length > 0) {
            ms.targets.forEach((t) => {
                const wss = this.clientSockets[t];
                if (wss) wss.forEach((ws) => {
                    if (ws.readyState === ws.OPEN)
                        ws.send(JSON.stringify(ms.message));
                });
            });
        } else {
            Object.values(this.clientSockets).forEach((wss) => {
                wss.forEach((ws) => {
                    if (ws.readyState === ws.OPEN)
                        ws.send(JSON.stringify(ms.message));
                });
            });
        }
    }

    public addClientSocket(clientID: string, ws: WebSocket): void {
        if (this.clientSockets[clientID]) {
            if (!this.clientSockets[clientID].includes(ws))
                this.clientSockets[clientID].push(ws);
        } else {
            this.clientSockets[clientID] = [ws];
        }
    }

    public removeClientSocket(clientID: string, ws: WebSocket): void {
        if (this.clientSockets[clientID]) {
            const i = this.clientSockets[clientID].indexOf(ws);
            if (i >= 0) this.clientSockets[clientID].splice(i, 1);
            if (this.clientSockets[clientID].length === 0) {
                delete this.clientSockets[clientID];
            }
        }
    }

    public destroy(): void {
        Object.values(this.clientSockets).forEach((wss) => {
            wss.forEach((ws) => ws.close());
        });
        this.clientSockets = {};
    }

    /* Posting Messages to clients */

    public postMessage(type: MessageType, msg: any = "", targetUsers: string[] = [], key = "data"): void {
        const j: Record<string, any> = {};
        j["type"] = type;
        if (msg && key.length > 0) j[key] = msg;
        this.emitMessage({
            message: j,
            targets: targetUsers
        });
    }
}