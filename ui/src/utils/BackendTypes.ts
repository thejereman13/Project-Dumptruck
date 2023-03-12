export interface SiteUser {
    id: string;
    googleID: string;
    name: string;
    email: string;
    recentRooms: number[];
    access_token: string;
    refresh_token: string;
    expiry_date: number;
    picture: string;
}

export interface RoomUser {
    clientID: string; //Technically a UUID
    name: string;
    userCount: number;
}

export interface RoomVideo {
    youtubeID: string;
    playing: boolean;
    duration: number;
    timestamp: number;
    queuedBy: string;
}

export interface PublicRoomPreview {
    currentVideo?: RoomVideo;
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
    skipErrors: boolean;
    waitUsers: boolean;
}

export interface RoomInfo {
    roomID: number;
    settings: RoomSettings;
    admins: string[];
}
