export enum MessageType {
    Sync = "sync",
    Ping = "ping",
    UserJoin = "userJoined",
    UserLeft = "userLeft",
    Play = "play",
    Pause = "pause",
    Video = "video",
    Init = "init",
    QueueAdd = "addQueue",
    QueueRemove = "removeQueue",
    QueueReorder = "reorderQueue"
}

export interface User {
    id: string; //Technically a UUID
    name: string;
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
}

export interface WSMessage {
    type: MessageType;
    data?: any;
    ID?: string;
    Room?: RoomInfo;
    Video?: Video;
}