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

export interface Video {
    youtubeID: string;
    playing: boolean;
    timeStamp: number;
    duration: number;
}

export interface PlaylistByUser {
    [user: string]: Video[];
}

export interface RoomInfo {
    roomName: string;
    userList: RoomUser[];
    adminList: string[]; // list of UUIDs matching userList members
    video: Video;
    playlist: PlaylistByUser;
    userQueue: string[];
    guestControls: boolean;
}

export interface WSMessage {
    type: MessageType;
    data?: any;
    error?: string;
    ID?: string;
    Room?: RoomInfo;
    Video?: Video;
}
