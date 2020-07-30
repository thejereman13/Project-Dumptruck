export enum MessageType {
    Sync = "sync", // Server synchronizing connected clients
    Ping = "ping", // Client updating connection status
    UserJoin = "userJoined", // Client joining the room
    UserLeft = "userLeft", // Client leaving the room
    UserList = "userList", // Server updating clients with the current list
    Play = "play", // Server starting playback, Client requesting playback
    Pause = "pause", // Server pausing playback, Client requesting pause
    Video = "video", // Server setting the active Client video
    Init = "init", // Server sending all initialization info
    Room = "room", // Server sending all room information
    QueueAdd = "addQueue", // Client adding a video id to queue
    QueueRemove = "removeQueue", // Client removing a video id from queue
    QueueOrder = "orderQueue" // Server updating the client playlist
}

export interface User {
    id: string; //Technically a UUID
    name: string;
    role: number;
}

export interface Video {
    youtubeID: string;
    title: string;
    channelName: string;
    playing: boolean;
    timeStamp: number;
    duration: number;
}

export interface RoomInfo {
    roomName: string;
    userList: User[];
    video: Video;
    playlist: Video[];
}

export interface WSMessage {
    type: MessageType;
    data?: any;
    ID?: string;
    Room?: RoomInfo;
    Video?: Video;
}