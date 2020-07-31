export interface Thumbnail {
    url: string;
    width: number;
    height: number;
}

export interface PlaylistInfo {
    id: string;
    title: string;
    description: string;
    thumbnailMaxRes: Thumbnail;
}

export function parsePlaylistJSON(playlistObject: any): PlaylistInfo {
    return {
        id: playlistObject.id,
        title: playlistObject.snippet.localized.title,
        description: playlistObject.snippet.localized.description,
        thumbnailMaxRes: playlistObject.snippet.thumbnails.maxres
    };
}
