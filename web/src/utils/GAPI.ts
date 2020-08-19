import { useGoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from "react-google-login";
import { SiteUser } from "./BackendTypes";
import { useContext, useState } from "preact/hooks";
import { createContext } from "preact";
import { CLIENTID } from "../constants";
import {
    PlaylistInfo,
    parsePlaylistJSON,
    VideoInfo,
    parsePlaylistItemJSON,
    parseVideoJSON,
    parseSearchVideoJSON
} from "./YoutubeTypes";

/* Util hook and context for logging in with GAPI user and retrieving user info */

export interface LoggedInUser extends SiteUser {
    profileURL: string;
}

export interface GAPIInfo {
    getUser: () => LoggedInUser | null;
    isAPILoaded: () => boolean;
}

export function useGoogleLoginAPI(): GAPIInfo {
    const [siteUser, setSiteUser] = useState<LoggedInUser | null>(null);
    const [isGAPILoaded, setAPILoaded] = useState<boolean>(false);

    useGoogleLogin({
        clientId: CLIENTID,
        scope: "https://www.googleapis.com/auth/youtube.readonly",
        onSuccess: (resp: GoogleLoginResponse | GoogleLoginResponseOffline) => {
            if (resp.code !== undefined) return;
            const response = resp as GoogleLoginResponse;
            fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: response.tokenId,
                    clientId: response.googleId
                })
            }).then(async userResp => {
                const j: SiteUser = await userResp.json();
                setSiteUser({
                    ...j,
                    profileURL: response.profileObj.imageUrl
                });
            });
            window.gapi.load("client", () => {
                setAPILoaded(true);
            });
        },
        onFailure: () => {
            console.warn("Failed to Load Login");
            setAPILoaded(false);
            setSiteUser(null);
        },
        isSignedIn: true,
        cookiePolicy: "single_host_origin",
        responseType: "id_token permission"
    });

    return {
        getUser: (): LoggedInUser | null => siteUser,
        isAPILoaded: (): boolean => isGAPILoaded
    };
}

export const GAPIContext = createContext<GAPIInfo | null>(null);
export const useGAPIContext = (): GAPIInfo | null => useContext(GAPIContext);

/* Util functions for fetching information from the GAPI */

export function RequestAllPlaylists(responseCallback: (playlists: PlaylistInfo[]) => void): void {
    gapi.client
        .request({
            path: "https://www.googleapis.com/youtube/v3/playlists",
            params: {
                part: "snippet,contentDetails",
                mine: true,
                maxResults: 50
            }
        })
        .then(resp => {
            //  TODO: handle more than one page
            // console.log(resp.result.pageInfo);
            responseCallback(resp.result.items.map(parsePlaylistJSON));
        });
}

export function RequestPlaylist(playlistID: string, responseCallback: (playlist: PlaylistInfo) => void): void {
    gapi.client
        .request({
            path: "https://www.googleapis.com/youtube/v3/playlists",
            params: {
                part: "snippet,contentDetails",
                id: playlistID,
                maxResults: 1
            }
        })
        .then(resp => {
            if (resp.result.items.length === 1) responseCallback(parsePlaylistJSON(resp.result.items[0]));
        });
}

/**
 * Request all information on a Youtube Playlist
 * @param playlistID ID of the Youtube Playlist
 * @param responseCallback Callback to update the list of VideoInfo. This will be called multiple times if multiple API requests are necessary
 * This allows faster response than waiting hundreds of ms for each query from youtube's API
 */
export function RequestVideosFromPlaylist(
    playlistID: string,
    responseCallback: (item: VideoInfo[], final: boolean) => void
): void {
    let returnArr: VideoInfo[] = [];
    let durationCount = 0;
    const getAllDurations = (): void => {
        const startIndex = durationCount * 50;
        const elementCount = Math.min(returnArr.length - startIndex, 50);
        console.log(startIndex, elementCount);
        gapi.client
            .request({
                path: "https://www.googleapis.com/youtube/v3/videos",
                params: {
                    part: "snippet,contentDetails",
                    id: returnArr.map(v => v.id).slice(startIndex, startIndex + elementCount), // max 50 at a time
                    maxResults: 50
                }
            })
            .then(resp => {
                if (resp.result.items.length === elementCount) {
                    resp.result.items.forEach((result: any, index: number) => {
                        returnArr[startIndex + index] = parseVideoJSON(result);
                    });

                    if (startIndex + elementCount < returnArr.length) {
                        durationCount += 1;
                        getAllDurations();
                    } else {
                        responseCallback(returnArr, true);
                    }
                }
            });
    };

    const addPage = (pageToken?: string): void => {
        gapi.client
            .request({
                path: "https://www.googleapis.com/youtube/v3/playlistItems",
                params: {
                    part: "snippet",
                    playlistId: playlistID,
                    maxResults: 50,
                    pageToken
                }
            })
            .then(resp => {
                returnArr = [...returnArr, ...resp.result.items.map(parsePlaylistItemJSON)];
                if (resp.result.nextPageToken) {
                    responseCallback(returnArr, false);
                    addPage(resp.result.nextPageToken);
                } else {
                    responseCallback(returnArr, false);
                    getAllDurations();
                }
            });
    };
    addPage();
}

export function RequestVideo(videoID: string, responseCallback: (video: VideoInfo) => void): void {
    gapi.client
        .request({
            path: "https://www.googleapis.com/youtube/v3/videos",
            params: {
                part: "snippet,contentDetails",
                id: videoID
            }
        })
        .then(resp => {
            if (resp.result.items.length === 1) responseCallback(parseVideoJSON(resp.result.items[0]));
        });
}

// Deprecated now that duration is always parsed into VideoInfo
// export function RequestVideoForBackend(
//     videoID: string,
//     responseCallback: (video: YoutubeVideoInformation) => void
// ): void {
//     gapi.client
//         .request({
//             path: "https://www.googleapis.com/youtube/v3/videos",
//             params: {
//                 part: "snippet,contentDetails",
//                 id: videoID
//             }
//         })
//         .then(resp => {
//             if (resp.result.items.length === 1) responseCallback(parseVideoForBackend(resp.result.items[0]));
//         });
// }

export function SearchVideo(query: string, responseCallback: (items: VideoInfo[]) => void): void {
    gapi.client
        .request({
            path: "https://www.googleapis.com/youtube/v3/search",
            params: {
                part: "snippet",
                maxResults: 50,
                q: query,
                type: "video",
                safeSearch: "none",
                videoEmbeddable: true
            }
        })
        .then(resp => {
            responseCallback(resp.result.items.map(parseSearchVideoJSON));
        });
}
