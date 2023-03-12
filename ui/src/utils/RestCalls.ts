import { SiteUser, RoomInfo, PublicRoomPreview } from "./BackendTypes";
import { VideoInfo, parseEmbeddedVideoJSON } from "./YoutubeTypes";

export async function GetCurrentUser(): Promise<SiteUser | null> {
    try {
        const resp = await fetch("/api/user");
        const json: SiteUser = await resp.json();
        if (json.id && json.id.length > 0) {
            return json;
        }
    } catch (e) {
        console.warn(e);
    }
    return null;
}

export async function GetAnyUser(controller: AbortController, userID: string): Promise<SiteUser | null> {
    try {
        const resp = await fetch(`/api/user/${userID}`, { signal: controller.signal });
        const json: SiteUser = await resp.json();
        if (json.id && json.id.length > 0) {
            return json;
        }
    } catch (e) {
        console.warn(e);
    }
    return null;
}

export async function ClearUserInfo(): Promise<boolean> {
    try {
        const resp = await fetch("/api/user", {
            method: "DELETE",
        });
        return resp.ok;
    } catch (e) {
        console.warn(e);
    }
    return false;
}

export async function LogoutUser(): Promise<boolean> {
    try {
        const resp = await fetch("/api/logout", {
            method: "POST",
        });
        return resp.ok;
    } catch (e) {
        console.warn(e);
    }
    return false;
}

export async function CreateNewRoom(): Promise<number | null> {
    try {
        const resp = await fetch("/api/room/0", {
            method: "POST",
        });
        const j: number = await resp.json();
        if (resp.ok && j > 0) {
            return j;
        }
    } catch (e) {
        console.warn(e);
    }
    return null;
}

export async function GetRoomInfo(controller: AbortController, roomID: string): Promise<RoomInfo | null> {
    try {
        const resp = await fetch(`/api/room/${roomID}`, { signal: controller.signal });
        const json: RoomInfo = await resp.json();
        if (json.roomID && json.roomID > 0) {
            return json;
        }
    } catch (e) {
        console.warn(e);
    }
    return null;
}

export async function GetRoomPlaying(controller: AbortController, roomID: string): Promise<PublicRoomPreview | null> {
    try {
        const resp = await fetch(`/api/playing/${roomID}`, { signal: controller.signal });
        if (!resp.ok) return null;
        const json: PublicRoomPreview = await resp.json();
        if (json) {
            if (
                json.currentVideo &&
                (json.currentVideo.queuedBy === "00000000-0000-0000-0000-000000000000" ||
                    json.currentVideo.youtubeID.length === 0)
            ) {
                json.currentVideo = undefined;
            } else {
                json.currentVideo = json.currentVideo ?? undefined;
            }
            return json;
        }
    } catch (e) {
        console.warn(e);
    }
    return null;
}

export async function GetRoomHistory(controller: AbortController, roomID: string): Promise<string[] | null> {
    try {
        const resp = await fetch(`/api/history/${roomID}`, { signal: controller.signal });
        if (!resp.ok) return null;
        const h = await resp.json();
        if (Array.isArray(h)) return h as string[];
        return null;
    } catch (e) {
        console.warn(e);
    }
    return null;
}

export async function GetActiveRooms(controller: AbortController): Promise<number[]> {
    try {
        const resp = await fetch("/api/rooms", { signal: controller.signal });
        if (!resp.ok) return [];
        const json: number[] = await resp.json();
        return json;
    } catch (e) {
        console.warn(e);
    }
    return [];
}

export async function RequestVideoPreview(controller: AbortController, videoID: string): Promise<VideoInfo | null> {
    if (!videoID || videoID.length !== 11) return null;
    try {
        const resp = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoID}&format=json`,
            { signal: controller.signal }
        );
        const json = await resp.json();
        if (!resp.ok || json.error) return null;
        return parseEmbeddedVideoJSON(json, videoID);
    } catch (e) {
        console.warn(e);
    }
    return null;
}

export async function RemoveRecentRoom(roomID: number): Promise<boolean> {
    try {
        const resp = await fetch("/api/userHistory/" + roomID, {
            method: "DELETE",
        });
        return resp.ok;
    } catch (e) {
        console.warn(e);
    }
    return false;
}

export async function RemoveRoom(roomID: number): Promise<boolean> {
    try {
        const resp = await fetch("/api/room/" + roomID, {
            method: "DELETE",
        });
        return resp.ok;
    } catch (e) {
        console.warn(e);
    }
    return false;
}
