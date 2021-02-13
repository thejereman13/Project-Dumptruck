export interface SiteUser {
    id: string; //technically a UUID
    googleID: string;
    name: string;
    email: string;
    recentRooms: number[]; // list of room ids, ordered by recency (latest at the end)
}

export interface RoomUser {
    clientID: string; //Technically a UUID
    name: string;
    role: number;
    userCount: number;
}

export interface RoomVideo {
    youtubeID: string;
    playing: boolean;
    duration: number;
    timestamp: number;
    queuedBy: string;
}

export interface YoutubeVideoInformation {
    videoID: string;
    duration: number;
}

export interface RoomSettings {
    name: string;
    trim: number;
    guestControls: boolean;
    publicVisibility: boolean;
    hifiTiming: boolean;
    skipErrors: boolean;
    waitUsers: boolean;
}

export interface RoomInfo {
    roomID: number;
    settings: RoomSettings;
    admins: string[];
}
