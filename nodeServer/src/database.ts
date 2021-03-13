import Redis from "ioredis";

const redis = new Redis();
redis.on("error", (e) => {
    console.error("REDIS ERROR: ", e);
});


export async function getUserData(userID: string): Promise<string> {
    const r = await redis.hget("user:" + userID, "data");
    if (r && r.length > 0)
        return r;
    else
        return "{}";
}

export async function setUserData(user: string, data: string): Promise<void> {
    await redis.hmset("user:" + user, "data", data);
}

export async function clearUserData(user: string): Promise<boolean> {
    await redis.del("user:" + user);
    const r = await redis.lrange("userAdmins:" + user, 0, -1);
    for (const u in r) {
        await redis.lrem("roomAdmins:" + u, 0, user);
    }
    return true;
}

export async function findGIDUser(gid: string): Promise<string | null> {
    const r = await redis.get("gid:" + gid);
    if (r && r.length > 0)
        return r;
    return null;
}

export async function setUserGID(user: string, gid: string): Promise<void> {
    await redis.hmset("user:" + user, "gid", gid);
    await redis.set("gid:" + gid, user);
}

export interface DBRoomSettings {
    name: string;
    trim: number; // trim the ending of the video in seconds (positive shortens, negative will add time)
    guestControls: boolean; // default false
    publicVisibility: boolean; // default true
    hifiTiming: boolean; // default false (disabled for 32 or more users)
    skipErrors: boolean; // default true
    waitUsers: boolean; // default false
}

export function defaultDBSettings(): DBRoomSettings {
    return {
        name: "",
        trim: 0,
        guestControls: false,
        publicVisibility: true,
        hifiTiming: false,
        skipErrors: true,
        waitUsers: false
    };
}

export interface DBRoomInfo {
    roomID: number;
    settings: DBRoomSettings;
    admins: string[];
}

export function parseRoomSettings(settings: Record<string, any>): DBRoomSettings {
    const room = defaultDBSettings();
    Object.entries(settings).forEach(([key, value]) => {
        switch (key) {
            case "name":
                room.name = value;
                break;
            case "trim":
                room.trim = Number(value);
                break;
            case "guestControls":
                room.guestControls = Boolean(value);
                break;
            case "publicVisibility":
                room.publicVisibility = Boolean(value);
                break;
            case "hifiTiming":
                room.hifiTiming = Boolean(value);
                break;
            case "skipErrors":
                room.skipErrors = Boolean(value);
                break;
            case "waitUsers":
                room.waitUsers = Boolean(value);
                break;
            default: break;
        }
    });
    return room;
}

export async function peekRoomInformation(roomID: number): Promise<DBRoomInfo | null> {
    if (Number.isNaN(roomID)) return null;
    const r = await redis.get("room:" + roomID);
    // r.value is empty if room doesn't exist
    if (r && r.length > 0) {
        const settings = parseRoomSettings(JSON.parse(r));
        if (settings.name.length > 0) {
            const admins = await redis.lrange("roomAdmins:" + roomID, 0, -1);
            return {
                roomID,
                settings,
                admins
            };
        } else {
            return {
                roomID,
                settings,
                admins: []
            };
        }
    }
    return null;
}

// TODO: check the type for settings
export async function setRoomSettings(roomID: number, settings: Record<string, any>): Promise<DBRoomSettings> {
    const roomSettings = parseRoomSettings(settings);
    if (roomSettings.name.length > 0)
        redis.set("room:" + roomID, JSON.stringify(roomSettings));
    return roomSettings;
}

export async function setRoomAdmins(roomID: number, admins: string[]): Promise<void> {
    const r = await redis.lrange("roomAdmins:" + roomID, 0, -1);
    if (r.length > 0)
        for (const k in r) {
            // remove room from a user's list of adminable rooms
            await redis.lrem("userAdmins:" + k, 0, roomID);
        }

    await redis.del("roomAdmins:" + roomID);
    for (const ad in admins) {
        if (ad) {
            await redis.lpush("roomAdmins:" + roomID, ad);
            await redis.lpush("userAdmins:" + ad, roomID.toString());
        }
    }
}
