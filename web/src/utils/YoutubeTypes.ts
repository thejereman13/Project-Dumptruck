import { YoutubeVideoInformation } from "./BackendTypes";

export interface Thumbnail {
    url: string;
    width: number;
    height: number;
}

export interface PlaylistInfo {
    id: string;
    title: string;
    channel: string;
    description: string;
    thumbnailMaxRes?: Thumbnail;
    videoCount: number;
}

export interface VideoInfo {
    id: string;
    title: string;
    channel: string;
    thumbnailMaxRes: Thumbnail;
    duration?: number;
}

function decodeHtml(html: string): string {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    const result = txt.value;
    txt.parentElement?.removeChild(txt);
    return result;
}

export function parseDurationString(time: string): number {
    const reg = RegExp(
        /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/gm
    );
    const matches = reg.exec(time);
    if (matches === null || matches.length < 9) return 0;
    const hours: number = matches[6] && matches[6].length > 0 ? Number(matches[6]) : 0;
    const minutes: number = matches[7] && matches[7].length > 0 ? Number(matches[7]) : 0;
    const seconds: number = matches[8] && matches[8].length > 0 ? Number(matches[8]) : 0;
    if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) return 0;
    return hours * 3600 + minutes * 60 + seconds;
}

export function durationToString(duration: number | undefined): string {
    if (duration === undefined) return "";
    const hours = Math.floor(duration / 3600);
    duration -= hours * 3600;
    const minutes = Math.floor(duration / 60);
    duration -= minutes * 60;
    const seconds = Math.floor(duration);
    return `${hours > 0 ? `${hours.toLocaleString()}:` : ""}${minutes.toLocaleString(undefined, {
        minimumIntegerDigits: 2
    })}:${seconds.toLocaleString(undefined, {
        minimumIntegerDigits: 2
    })}`;
}

export function getBasicThumbnail(id: string): Thumbnail {
    return {
        url: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        width: 320,
        height: 180
    };
}

function getCorrectThumbnail(thumbnailList: any): Thumbnail {
    // return the highest resolution available except maxRes
    // maybe add more complicated logic later to base size off of screen DPI/zoom/etc
    return thumbnailList.medium ?? thumbnailList.default;
}

export function videoIDFromURL(url: string): string | undefined {
    const matches = /(youtu\S*)(watch\?.*v=|\/)([a-zA-Z0-9_-]*)/.exec(url);
    if (matches && matches.length >= 4 && matches[3].length === 11) return matches[3];
    return undefined;
}

export function playlistIDFromURL(url: string): string | undefined {
    const matches = /(youtu\S*)(playlist\?.*list=)([a-zA-Z0-9_-]*)/.exec(url);
    if (matches && matches.length >= 4 && matches[3].length === 34) return matches[3];
    return undefined;
}

export function parsePlaylistJSON(playlistObject: any): PlaylistInfo {
    return {
        id: playlistObject.id,
        title: decodeHtml(playlistObject.snippet.localized?.title ?? playlistObject.snippet.title ?? ""),
        description: decodeHtml(
            playlistObject.snippet.localized?.description ?? playlistObject.snippet.description ?? ""
        ),
        channel: decodeHtml(playlistObject.snippet.channelTitle),
        thumbnailMaxRes: playlistObject.snippet.thumbnails
            ? getCorrectThumbnail(playlistObject.snippet.thumbnails)
            : getBasicThumbnail(playlistObject.id),
        videoCount: playlistObject.contentDetails.itemCount
    };
}

export function parsePlaylistItemJSON(itemObject: any): VideoInfo {
    return {
        id: itemObject.snippet.resourceId.videoId,
        title: decodeHtml(itemObject.snippet.title),
        channel: "",
        thumbnailMaxRes: getCorrectThumbnail(itemObject.snippet.thumbnails)
    };
}

export function parseVideoJSON(videoObject: any): VideoInfo {
    return {
        id: videoObject.id,
        title: decodeHtml(videoObject.snippet.localized?.title ?? videoObject.snippet.title ?? ""),
        channel: decodeHtml(videoObject.snippet.channelTitle),
        thumbnailMaxRes: videoObject.snippet.thumbnails
            ? getCorrectThumbnail(videoObject.snippet.thumbnails)
            : getBasicThumbnail(videoObject.id),
        duration: videoObject.contentDetails ? parseDurationString(videoObject.contentDetails.duration) : 0
    };
}

export function parseSearchVideoJSON(videoObject: any): VideoInfo {
    return {
        id: videoObject.id.videoId,
        title: decodeHtml(videoObject.snippet.title),
        channel: decodeHtml(videoObject.snippet.channelTitle),
        thumbnailMaxRes: videoObject.snippet.thumbnails
            ? getCorrectThumbnail(videoObject.snippet.thumbnails)
            : getBasicThumbnail(videoObject.id.videoId)
    };
}

export function parseVideoForBackend(videoObject: any): YoutubeVideoInformation {
    return {
        videoID: videoObject.id,
        duration: videoObject.contentDetails.duration
    };
}

export function convertInfoForBackend(videoObject: VideoInfo): YoutubeVideoInformation {
    return {
        videoID: videoObject.id,
        duration: videoObject.duration ?? 0
    };
}

export function parseEmbeddedVideoJSON(videoObject: any, id: string): VideoInfo {
    return {
        id,
        title: decodeHtml(videoObject.title),
        channel: decodeHtml(videoObject.author_name),
        thumbnailMaxRes: {
            height: videoObject.thumbnail_height,
            width: videoObject.thumbnail_width,
            url: videoObject.thumbnail_url.replace("hqdefault", "mqdefault")
        }
    };
}
