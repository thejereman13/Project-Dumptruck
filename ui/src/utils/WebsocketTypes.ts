import { RoomUser } from "./BackendTypes";

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
    Seek = "seek", // Client skipping within the video
    Video = "video", // Server setting the active Client video
    Init = "init", // Server sending all initialization info
    Room = "room", // Server sending all room information
    QueueAddBack = "addQueueBack", // Client adding a video id to end of queue
    QueueAddFront = "addQueueFront", // Client adding a video id to front of queue
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

export interface Video {
    youtubeID: string;
    playing: boolean;
    timeStamp: number;
    duration: number;
    queuedBy: string;
}

export interface PlaylistByUser {
    [user: string]: Video[];
}

export interface RoomInfo {
    roomName: string;
    userList: RoomUser[];
    adminList: string[]; // list of UUIDs matching userList members
    video?: Video;
    playlist: PlaylistByUser;
    userQueue: string[];
    guestControls: boolean;
}

export interface WSMessage {
    t: MessageType;
    d?: any;
    error?: string;
    ID?: string;
    Room?: RoomInfo;
    Video?: Video;
}
