export interface SiteUser {
    id: string; //technically a UUID
    googleID: string;
    name: string;
    email: string;
    recentRooms: number[];
}

export interface RoomUser {
    clientID: string; //Technically a UUID
    name: string;
    role: number;
}
