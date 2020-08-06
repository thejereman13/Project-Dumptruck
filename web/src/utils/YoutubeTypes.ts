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
    thumbnailMaxRes: Thumbnail;
    videoCount: number;
}

export interface VideoInfo {
    id: string;
    title: string;
    channel: string;
    description: string;
    thumbnailMaxRes: Thumbnail;
}

function decodeHtml(html: string): string {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    const result = txt.value;
    txt.parentElement?.removeChild(txt);
    return result;
}

function getCorrectThumbnail(thumbnailList: any): Thumbnail {
    // return the highest resolution available except maxRes
    // maybe add more complicated logic later to base size off of screen DPI/zoom/etc
    return thumbnailList.high ?? thumbnailList.medium ?? thumbnailList.default;
}

export function videoIDFromURL(url: string): string | undefined {
    const matches = /(youtu\S*)(watch\?v=|\/)(\w*)/.exec(url);
    if (matches && matches.length >= 4 && matches[3].length === 11) return matches[3];
    return undefined;
}

export function parsePlaylistJSON(playlistObject: any): PlaylistInfo {
    return {
        id: playlistObject.id,
        title: decodeHtml(playlistObject.snippet.localized.title),
        description: decodeHtml(playlistObject.snippet.localized.description),
        channel: decodeHtml(playlistObject.snippet.channelTitle),
        thumbnailMaxRes: getCorrectThumbnail(playlistObject.snippet.thumbnails),
        videoCount: playlistObject.contentDetails.itemCount
    };
}

export function parsePlaylistItemJSON(itemObject: any): VideoInfo {
    return {
        id: itemObject.id,
        title: decodeHtml(itemObject.snippet.title),
        channel: decodeHtml(itemObject.snippet.channelTitle),
        description: decodeHtml(itemObject.snippet.description),
        thumbnailMaxRes: getCorrectThumbnail(itemObject.snippet.thumbnails)
    };
}

export function parseVideoJSON(videoObject: any): VideoInfo {
    return {
        id: videoObject.id,
        title: decodeHtml(videoObject.snippet.localized.title),
        channel: decodeHtml(videoObject.snippet.channelTitle),
        description: decodeHtml(videoObject.snippet.localized.description),
        thumbnailMaxRes: getCorrectThumbnail(videoObject.snippet.thumbnails)
    };
}

export function parseSearchVideoJSON(videoObject: any): VideoInfo {
    return {
        id: videoObject.id.videoId,
        title: decodeHtml(videoObject.snippet.title),
        channel: decodeHtml(videoObject.snippet.channelTitle),
        description: decodeHtml(videoObject.snippet.description),
        thumbnailMaxRes: getCorrectThumbnail(videoObject.snippet.thumbnails)
    };
}

export function parseVideoForBackend(videoObject: any): YoutubeVideoInformation {
    return {
        videoID: videoObject.id,
        title: videoObject.snippet.localized.title,
        channel: videoObject.snippet.channelTitle,
        duration: videoObject.contentDetails.duration
    };
}
