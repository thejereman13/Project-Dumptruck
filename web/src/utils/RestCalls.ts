import { SiteUser } from "./BackendTypes";
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

export async function RequestVideoPreview(videoID: string): Promise<VideoInfo | null> {
    try {
        const resp = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoID}`);
        const json = await resp.json();
        return parseEmbeddedVideoJSON(json, videoID);
    } catch (e) {
        console.warn(e);
    }
    return null;
}
