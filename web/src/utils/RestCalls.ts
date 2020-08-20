import { SiteUser } from "./BackendTypes";
import { VideoInfo, parseEmbeddedVideoJSON } from "./YoutubeTypes";
import { Ref } from "preact/hooks";

export async function GetCurrentUser(controller: Ref<AbortController>): Promise<SiteUser | null> {
    try {
        const resp = await fetch("/api/user", { signal: controller.current.signal });
        const json: SiteUser = await resp.json();
        if (json.id && json.id.length > 0) {
            return json;
        }
    } catch (e) {
        console.warn(e);
    }
    return null;
}

export async function RequestVideoPreview(
    videoID: string,
    controller: Ref<AbortController>
): Promise<VideoInfo | null> {
    if (!videoID || videoID.length !== 11) return null;
    try {
        const resp = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoID}`, {
            signal: controller.current.signal
        });
        const json = await resp.json();
        if (!resp.ok || json.error) return null;
        return parseEmbeddedVideoJSON(json, videoID);
    } catch (e) {
        console.warn(e);
    }
    return null;
}
