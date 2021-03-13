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

    private clientSockets: Map<string, WebSocket[]> = new Map();

    private emitMessage(ms: Message) {
        // const s = JSON.stringify(ms.message);
        // Could switch to using one buffer for all WS connections
        // May or may not be more efficient
        const data = Buffer.from(JSON.stringify(ms.message));
        // eslint-disable-next-line
        // @ts-ignore
        const list = WebSocket.Sender.frame(data, {
            readOnly: false,
            mask: false,
            rsv1: false,
            opcode: 1,
            fin: true
        });
        if (ms.targets.length > 0) {
            ms.targets.forEach((t) => {
                const wss = this.clientSockets.get(t);
                if (wss) wss.forEach((ws) => {
                    if (ws.readyState === ws.OPEN)
                        // ws.send(s);
                        // eslint-disable-next-line
                        // @ts-ignore
                        list.forEach((buf) => ws._socket.write(buf));
                });
            });
        } else {
            for (const wss of this.clientSockets.values()) {
                wss.forEach((ws) => {
                    if (ws.readyState === ws.OPEN)
                        // ws.send(s);
                        // eslint-disable-next-line
                        // @ts-ignore
                        list.forEach((buf) => ws._socket.write(buf));
                });
            }
        }
    }

    public addClientSocket(clientID: string, ws: WebSocket): void {
        if (this.clientSockets.has(clientID)) {
            const lst = this.clientSockets.get(clientID);
            if (lst && !lst.includes(ws))
                lst.push(ws);
        } else {
            this.clientSockets.set(clientID, [ws]);
        }
    }

    public removeClientSocket(clientID: string, ws: WebSocket): void {
        if (this.clientSockets.has(clientID)) {
            const lst = this.clientSockets.get(clientID);
            if (lst) {
                const i = lst.indexOf(ws) ?? -1;
                if (i >= 0) lst.splice(i, 1);
                if (lst.length === 0) {
                    this.clientSockets.delete(clientID);
                }
            }
        }
    }

    public destroy(): void {
        for (const wss of this.clientSockets.values()) {
            wss.forEach((ws) => ws.close());
        }
        this.clientSockets.clear();
    }

    /* Posting Messages to clients */

    public postMessage(type: MessageType, msg: any = "", targetUsers: string[] = [], key = "d"): void {
        const j: Record<string, any> = {};
        j["t"] = type;
        if (key.length > 0) j[key] = msg;
        this.emitMessage({
            message: j,
            targets: targetUsers
        });
    }
}