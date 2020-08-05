import he from "he";
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

function getCorrectThumbnail(thumbnailList: any): Thumbnail {
    // return the highest resolution available except maxRes
    // maybe add more complicated logic later to base size off of screen DPI/zoom/etc
    return thumbnailList.high ?? thumbnailList.medium ?? thumbnailList.default;
}

export function parsePlaylistJSON(playlistObject: any): PlaylistInfo {
    return {
        id: playlistObject.id,
        title: he.decode(playlistObject.snippet.localized.title),
        description: he.decode(playlistObject.snippet.localized.description),
        channel: he.decode(playlistObject.snippet.channelTitle),
        thumbnailMaxRes: getCorrectThumbnail(playlistObject.snippet.thumbnails),
        videoCount: playlistObject.contentDetails.itemCount
    };
}

export function parsePlaylistItemJSON(itemObject: any): VideoInfo {
    return {
        id: itemObject.id,
        title: he.decode(itemObject.snippet.title),
        channel: he.decode(itemObject.snippet.channelTitle),
        description: he.decode(itemObject.snippet.description),
        thumbnailMaxRes: getCorrectThumbnail(itemObject.snippet.thumbnails)
    };
}

export function parseVideoJSON(videoObject: any): VideoInfo {
    return {
        id: videoObject.id,
        title: he.decode(videoObject.snippet.localized.title),
        channel: he.decode(videoObject.snippet.channelTitle),
        description: he.decode(videoObject.snippet.localized.description),
        thumbnailMaxRes: getCorrectThumbnail(videoObject.snippet.thumbnails)
    };
}

export function parseSearchVideoJSON(videoObject: any): VideoInfo {
    return {
        id: videoObject.id.videoId,
        title: he.decode(videoObject.snippet.title),
        channel: he.decode(videoObject.snippet.channelTitle),
        description: he.decode(videoObject.snippet.description),
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
