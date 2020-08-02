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
        title: playlistObject.snippet.localized.title,
        description: playlistObject.snippet.localized.description,
        channel: playlistObject.snippet.channelTitle,
        thumbnailMaxRes: getCorrectThumbnail(playlistObject.snippet.thumbnails),
        videoCount: playlistObject.contentDetails.itemCount
    };
}

export function parsePlaylistItemJSON(itemObject: any): VideoInfo {
    return {
        id: itemObject.id,
        title: itemObject.snippet.title,
        channel: itemObject.snippet.channelTitle,
        description: itemObject.snippet.description,
        thumbnailMaxRes: getCorrectThumbnail(itemObject.snippet.thumbnails)
    };
}

export function parseVideoJSON(videoObject: any): VideoInfo {
    return {
        id: videoObject.id,
        title: videoObject.snippet.localized.title,
        channel: videoObject.snippet.channelTitle,
        description: videoObject.snippet.localized.description,
        thumbnailMaxRes: getCorrectThumbnail(videoObject.snippet.thumbnails)
    };
}
