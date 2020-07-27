export interface UserInformation {
    id: string;
    name: string;
    color: number[];
    group: number;
    ready: boolean;
}

export interface VideoInformation {
    description: string;
    duration: number;
    id: string;
    play: boolean;
    requestDuration: boolean;
    sender: {id: string; name: string; };
    title: string;
    uuid: string;
}

export interface PlayerInformation {
    playing: boolean;
    video: VideoInformation;
    time: number;
    hasVideo: boolean;
}

export interface RoomInformation {
    title: string;
    mode: number;
    permanent: string;
    id: string;
    owner: string;
    permissions: Record<string, number[]>;
    player: PlayerInformation;
    users: UserInformation[];
    playlist: VideoInformation[];
    log: string[];
    userSettings: {};
}

export interface AuthInformation {
    clientId: string;
    group: number;
    room: RoomInformation;
}