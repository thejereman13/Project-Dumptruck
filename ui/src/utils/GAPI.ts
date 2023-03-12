import {
    PlaylistInfo,
    parsePlaylistJSON,
    VideoInfo,
    parsePlaylistItemJSON,
    parseVideoJSON,
    parseSearchVideoJSON
} from "./YoutubeTypes";
import { RegisterNotification } from "../components/Notification";
import { ObjectCache } from "./Caching";
import { VideoCardInfo } from "../components/displayCards/VideoCard";
import { createStore } from "solid-js/store";


/*
 *      Util functions for fetching information from the GAPI
 *
 */

export function RequestAllPlaylists(
    access_token: string,
    responseCallback: (playlists: PlaylistInfo[] | undefined, final: boolean) => void
): void {
    let returnArr: PlaylistInfo[] = [];
    const addPage = (pageToken?: string): void => {
        const gapiParams = new URLSearchParams({
            part: "snippet,contentDetails",
            mine: "true",
            maxResults: "50",
            access_token,
        });
        if (pageToken)
            gapiParams.set("pageToken", pageToken);
        fetch(`https://www.googleapis.com/youtube/v3/playlists?${gapiParams.toString()}`)
            .then((res) => res.json())
            .then((result) => {
                returnArr = [...returnArr, ...result.items.map(parsePlaylistJSON)];
                if (result.nextPageToken) {
                    responseCallback(returnArr, false);
                    addPage(result.nextPageToken);
                } else {
                    responseCallback(returnArr, true);
                }
            })
            .catch(() => {
                RegisterNotification("Network Error: Failed to Retrieve Playlist Information", "error");
                responseCallback(undefined, true);
            });
    };
    addPage();
}

export function RequestLikedVideos(
    access_token: string,
    responseCallback: (item: VideoInfo[] | undefined, final: boolean) => void,
    peek = false
): void {
    let returnArr: VideoInfo[] = [];
    const addPage = (pageToken?: string): void => {
        const gapiParams = new URLSearchParams({
            part: "snippet, contentDetails",
            myRating: "like",
            maxResults: peek ? "1" : "50",
            access_token,
        });
        if (pageToken)
        gapiParams.set("pageToken", pageToken);
        fetch(`https://www.googleapis.com/youtube/v3/videos?${gapiParams.toString()}`)
            .then((res) => res.json())
            .then((result) => {
                returnArr = [...returnArr, ...result.items.map(parseVideoJSON)];
                if (!peek && result.nextPageToken) {
                    responseCallback(returnArr, false);
                    addPage(result.nextPageToken);
                } else {
                    responseCallback(returnArr, true);
                }
            })
            .catch(() => {
                RegisterNotification("Network Error: Failed to Retrieve Playlist Information", "error");
                responseCallback(undefined, true);
            });
    };
    addPage();
}

// Should average < 1MB of LocalStorage
export const videoInfoCache = new ObjectCache<VideoCardInfo>("VideoInfoCache", 4096);

// /**
//  * Request all information on a Youtube Playlist
//  * @param playlistID ID of the Youtube Playlist
//  * @param responseCallback Callback to update the list of VideoInfo. This will be called multiple times if multiple API requests are necessary
//  * This allows faster response than waiting hundreds of ms for each query from youtube's API
//  */
export function RequestVideosFromPlaylist(
    playlistID: string,
    access_token: string,
    responseCallback: (item: VideoInfo[] | undefined, final: boolean) => void
): void {
    let returnArr: VideoInfo[] = [];
    const getAllDurations = (durationsRequested: number[]): void => {
        if (durationsRequested.length === 0) {
            responseCallback(returnArr, true);
            return;
        }
        const elementCount = Math.min(durationsRequested.length, 50);
        const workingDurations = durationsRequested.slice(0, elementCount);
        const gapiParams = new URLSearchParams({
            part: "snippet,contentDetails",
            id: workingDurations.map((ind) => returnArr[ind].id).join(","), // max 50 at a time
            maxResults: "50",
            access_token,
        });
        fetch(`https://www.googleapis.com/youtube/v3/videos?${gapiParams.toString()}`)
            .then((res) => res.json())
            .then((result) => {
                if (result.items.length === elementCount) {
                    result.items.forEach((result: any, index: number) => {
                        const vid = parseVideoJSON(result);
                        returnArr[workingDurations[index]] = vid;
                        videoInfoCache.pushInfoStore({
                            id: vid.id,
                            title: vid.title,
                            channel: vid.channel,
                            duration: vid.duration,
                            thumbnailURL: vid.thumbnailMaxRes.url
                        });
                    });
                } else {
                    let i = 0;
                    result.items.forEach((result: any) => {
                        const vid = parseVideoJSON(result);
                        // Skip over any invalid videos that couldn't be returned by GAPI request
                        while (returnArr[workingDurations[i]].id !== vid.id) {
                            i++;
                        }
                        returnArr[workingDurations[i]] = vid;
                        videoInfoCache.pushInfoStore({
                            id: vid.id,
                            title: vid.title,
                            channel: vid.channel,
                            duration: vid.duration,
                            thumbnailURL: vid.thumbnailMaxRes.url
                        });
                        i++;
                    });
                }

                if (elementCount < durationsRequested.length) {
                    getAllDurations(durationsRequested.slice(elementCount));
                    responseCallback(returnArr, false);
                } else {
                    responseCallback(returnArr, true);
                }
            })
            .catch(() => {
                RegisterNotification("Network Error: Failed to Retrieve Playlist Information", "error");
                responseCallback(undefined, true);
            });
    };

    const addPage = (pageToken?: string): void => {
        const gapiParams = new URLSearchParams({
            part: "snippet",
            playlistId: playlistID,
            maxResults: "50",
            access_token,
        });
        if (pageToken)
            gapiParams.set("pageToken", pageToken);
        fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${gapiParams.toString()}`)
            .then((res) => res.json())
            .then((result) => {
                returnArr = [...returnArr, ...result.items.map(parsePlaylistItemJSON)];
                if (result.nextPageToken) {
                    responseCallback(returnArr, false);
                    addPage(result.nextPageToken);
                } else {
                    responseCallback(returnArr, false);
                    const needDurations: number[] = [];
                    returnArr.forEach((v, i) => {
                        const vid = videoInfoCache.queryInfoStore(v.id);
                        if (vid && vid.duration) {
                            returnArr[i] = { ...returnArr[i], ...vid };
                        } else {
                            needDurations.push(i);
                        }
                    });
                    getAllDurations(needDurations);
                }
            })
            .catch(() => {
                RegisterNotification("Network Error: Failed to Retrieve Playlist Information", "error");
                responseCallback(undefined, true);
            });
    };
    addPage();
}

export function RequestVideo(
    videoID: string,
    access_token: string,
    responseCallback: (video: VideoInfo) => void
): void {
    const gapiParams = new URLSearchParams({
        part: "snippet,contentDetails",
        id: videoID,
        access_token,
    });
    fetch(`https://www.googleapis.com/youtube/v3/videos?${gapiParams.toString()}`)
        .then((res) => res.json())
        .then((result) => {
            if (result.items.length === 1)
                responseCallback(parseVideoJSON(result.items[0]));
        })
        .catch(() => {
            RegisterNotification("Network Error: Failed to Retrieve Video Information", "error");
        });
}

export function RequestPlaylist(
    playlistID: string,
    access_token: string,
    responseCallback: (playlist: PlaylistInfo) => void
): void {
    const gapiParams = new URLSearchParams({
        part: "snippet,contentDetails",
        id: playlistID,
        access_token,
    });
    fetch(`https://www.googleapis.com/youtube/v3/playlists?${gapiParams.toString()}`)
        .then((res) => res.json())
        .then((result) => {
            if (result.items.length === 1)
                responseCallback(parsePlaylistJSON(result.items[0]));
        })
        .catch(() => {
            RegisterNotification("Network Error: Failed to Retrieve Playlist Information", "error");
        });
}

export function SearchVideo(
    query: string,
    access_token: string,
    responseCallback: (items: VideoInfo[]) => void
): void {
    const gapiParams = new URLSearchParams({
        part: "snippet",
        maxResults: "50",
        q: query,
        type: "video",
        safeSearch: "none",
        videoEmbeddable: "true",
        access_token,
    });
    fetch(`https://www.googleapis.com/youtube/v3/search?${gapiParams.toString()}`)
        .then((res) => res.json())
        .then((result) => {
            responseCallback(result.items.map(parseSearchVideoJSON));
        })
        .catch(() => {
            RegisterNotification("Network Error: Failed to Retrieve Video Information", "error");
        });
}
