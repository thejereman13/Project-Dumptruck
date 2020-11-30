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
}

export interface RoomInfo {
    roomID: number;
    settings: RoomSettings;
    admins: string[];
}
