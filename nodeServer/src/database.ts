import Redis from "ioredis";

const user_prefix = "user:";
const userAdmins_prefix = "userAdmins:";
const roomAdmins_prefix = "roomAdmins:";
const roomHistory_prefix = "roomHistory:";
const roomSettings_prefix = "room:";

const redis = new Redis();
redis.on("error", (e) => {
    console.error("REDIS ERROR: ", e);
});


export async function getUserData(userID: string): Promise<string> {
    const r = await redis.hget(user_prefix + userID, "data");
    if (r && r.length > 0)
        return r;
    else
        return "{}";
}

export async function getAllUsers(): Promise<string[]> {
    return new Promise((resolve) => {
        const list = new Set<string>();
        const stream = redis.scanStream({
            match: user_prefix + "*",
        });
        stream.on("data", (resultKeys: string[]) => {
            resultKeys.forEach((key) => {
                list.add(key.replace(user_prefix, ""));
            });
        });
        stream.on("end", () => {
            resolve(new Array(...list.values()));
        })
    });
}

export async function setUserData(user: string, data: string): Promise<void> {
    await redis.hmset(user_prefix + user, "data", data);
}

export async function clearUserData(user: string): Promise<boolean> {
    await redis.del(user_prefix + user);
    const r = await redis.lrange(userAdmins_prefix + user, 0, -1);
    for (const u of r) {
        await redis.lrem(roomAdmins_prefix + u, 0, user);
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
    await redis.hmset(user_prefix + user, "gid", gid);
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
    history: string[];
}

export function parseRoomSettings(settings: Record<string, any>): DBRoomSettings {
    const room = defaultDBSettings();
    Object.entries(settings).forEach(([key, value]) => {
        switch (key as keyof DBRoomSettings) {
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
        }
    });
    return room;
}

export async function peekRoomInformation(roomID: number): Promise<DBRoomInfo | null> {
    if (Number.isNaN(roomID)) return null;
    const r = await redis.get(roomSettings_prefix + roomID);
    // r.value is empty if room doesn't exist
    if (r && r.length > 0) {
        const settings = parseRoomSettings(JSON.parse(r));
        if (settings.name.length > 0) {
            const admins = await redis.lrange(roomAdmins_prefix + roomID, 0, -1);
            const history = await redis.lrange(roomHistory_prefix + roomID, 0, -1);
            return {
                roomID,
                settings,
                admins,
                history
            };
        } else {
            return {
                roomID,
                settings,
                admins: [],
                history: [],
            };
        }
    }
    return null;
}

export async function setRoomSettings(roomID: number, settings: Record<string, any>): Promise<DBRoomSettings> {
    const roomSettings = parseRoomSettings(settings);
    if (roomSettings.name.length > 0)
        redis.set(roomSettings_prefix + roomID, JSON.stringify(roomSettings));
    return roomSettings;
}

export async function removeRoomInfo(roomID: number): Promise<void> {
    await redis.del(roomSettings_prefix + roomID);
    await redis.del(roomHistory_prefix + roomID);
    const r = await redis.lrange(roomAdmins_prefix + roomID, 0, -1);
    if (r.length > 0)
        for (const k of r) {
            // remove room from a user's list of adminable rooms
            await redis.lrem(userAdmins_prefix + k, 0, roomID);
        }
}

export async function setRoomAdmins(roomID: number, admins: string[]): Promise<void> {
    const r = await redis.lrange(roomAdmins_prefix + roomID, 0, -1);
    if (r.length > 0)
        for (const k of r) {
            // remove room from a user's list of adminable rooms
            await redis.lrem(userAdmins_prefix + k, 0, roomID);
        }

    await redis.del(roomAdmins_prefix + roomID);
    for (const ad of admins) {
        if (ad) {
            await redis.lpush(roomAdmins_prefix + roomID, ad);
            await redis.lpush(userAdmins_prefix + ad, roomID.toString());
        }
    }
}

export async function appendRoomHistory(roomID: number, videoID: string): Promise<void> {
    await redis.lpush(roomHistory_prefix + roomID, videoID);
    await redis.ltrim(roomHistory_prefix + roomID, 0, 249);
}
