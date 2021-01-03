import { useGoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from "react-google-login";
import { SiteUser } from "./BackendTypes";
import { useContext, useState, Ref, useCallback } from "preact/hooks";
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
import { RegisterNotification } from "../components/Notification";

/* Util hook and context for logging in with GAPI user and retrieving user info */

export interface LoggedInUser extends SiteUser {
    profileURL: string;
}

export interface GAPIInfo {
    getUser: () => LoggedInUser | null;
    isAPILoaded: () => boolean;
    forceSignIn: (resp: GoogleLoginResponse | GoogleLoginResponseOffline) => void;
    forceSignOut: () => void;
}

export function useGoogleLoginAPI(): GAPIInfo {
    const [siteUser, setSiteUser] = useState<LoggedInUser | null>(null);
    const [isGAPILoaded, setAPILoaded] = useState<boolean>(false);

    const refreshTokenSetup = (res: GoogleLoginResponse): void => {
        // Timing to renew access token
        let refreshTiming = (res.tokenObj.expires_in || 3600 - 5 * 60) * 1000;
        const refreshToken = async (): Promise<void> => {
            const newAuthRes = await res.reloadAuthResponse();
            refreshTiming = (newAuthRes.expires_in || 3600 - 5 * 60) * 1000;
            // saveUserToken(newAuthRes.access_token);  <-- save new token
            // Setup the other timer after the first one
            setTimeout(() => {
                refreshToken();
            }, refreshTiming);
        };
        // Setup first refresh timer
        setTimeout(() => {
            refreshToken();
        }, refreshTiming);
    };

    const onSuccess = useCallback((resp: GoogleLoginResponse | GoogleLoginResponseOffline): void => {
        if (resp.code !== undefined) return;
        const response = resp as GoogleLoginResponse;
        try {
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
                if (j !== undefined && j.id !== undefined && j.id.length > 0)
                    setSiteUser({
                        ...j,
                        profileURL: response.profileObj.imageUrl
                    });
            });
        } catch (e) {
            console.warn("Failed to Login on Server", e);
            RegisterNotification("Failed to Login", "error");
        }
        refreshTokenSetup(response);
        window.gapi.load("client", () => {
            setAPILoaded(true);
        });
    }, []);

    const onFailure = useCallback((preventNotification?: boolean): void => {
        setAPILoaded(false);
        setSiteUser(null);
        if (preventNotification) return;
        console.warn("Failed to Load Login");
        RegisterNotification("Failed to Login with Google", "error");
    }, []);

    useGoogleLogin({
        clientId: CLIENTID,
        scope: "https://www.googleapis.com/auth/youtube",
        onSuccess: onSuccess,
        onFailure: () => onFailure(),
        isSignedIn: true,
        cookiePolicy: "single_host_origin",
        responseType: "id_token permission"
    });

    return {
        getUser: (): LoggedInUser | null => siteUser,
        isAPILoaded: (): boolean => isGAPILoaded,
        forceSignIn: onSuccess,
        forceSignOut: (): void => onFailure(true)
    };
}

export const GAPIContext = createContext<GAPIInfo | null>(null);
export const useGAPIContext = (): GAPIInfo | null => useContext(GAPIContext);

/*
 *      Util functions for fetching information from the GAPI
 *
 */

export function RequestAllPlaylists(
    controller: Ref<AbortController>,
    responseCallback: (playlists: PlaylistInfo[] | undefined, final: boolean) => void
): void {
    let returnArr: PlaylistInfo[] = [];
    const addPage = (pageToken?: string): void => {
        gapi.client
            .request({
                path: "https://www.googleapis.com/youtube/v3/playlists",
                params: {
                    part: "snippet,contentDetails",
                    mine: true,
                    maxResults: 50,
                    pageToken
                }
            })
            .then(resp => {
                if (controller.current.signal.aborted) return;
                returnArr = [...returnArr, ...resp.result.items.map(parsePlaylistJSON)];
                if (resp.result.nextPageToken) {
                    responseCallback(returnArr, false);
                    addPage(resp.result.nextPageToken);
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
    controller: Ref<AbortController>,
    responseCallback: (item: VideoInfo[] | undefined, final: boolean) => void,
    peek = false
): void {
    let returnArr: VideoInfo[] = [];
    const addPage = (pageToken?: string): void => {
        gapi.client
            .request({
                path: "https://www.googleapis.com/youtube/v3/videos",
                params: {
                    part: "snippet, contentDetails",
                    myRating: "like",
                    maxResults: peek ? 1 : 50,
                    pageToken
                }
            })
            .then(resp => {
                if (controller.current.signal.aborted) return;
                returnArr = [...returnArr, ...resp.result.items.map(parseVideoJSON)];
                if (!peek && resp.result.nextPageToken) {
                    responseCallback(returnArr, false);
                    addPage(resp.result.nextPageToken);
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

/**
 * Request all information on a Youtube Playlist
 * @param playlistID ID of the Youtube Playlist
 * @param responseCallback Callback to update the list of VideoInfo. This will be called multiple times if multiple API requests are necessary
 * This allows faster response than waiting hundreds of ms for each query from youtube's API
 */
export function RequestVideosFromPlaylist(
    playlistID: string,
    controller: Ref<AbortController>,
    responseCallback: (item: VideoInfo[] | undefined, final: boolean) => void
): void {
    let returnArr: VideoInfo[] = [];
    let durationCount = 0;
    const getAllDurations = (): void => {
        const startIndex = durationCount * 50;
        const elementCount = Math.min(returnArr.length - startIndex, 50);
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
                if (!controller.current.signal.aborted) {
                    if (resp.result.items.length === elementCount) {
                        resp.result.items.forEach((result: any, index: number) => {
                            returnArr[startIndex + index] = parseVideoJSON(result);
                        });
                    } else {
                        let i = 0;
                        resp.result.items.forEach((result: any) => {
                            const vid = parseVideoJSON(result);
                            // Skip over any invalid videos that couldn't be returned by GAPI request
                            while (returnArr[startIndex + i].id !== vid.id) {
                                i++;
                            }
                            returnArr[startIndex + i] = vid;
                            i++;
                        });
                    }

                    if (startIndex + elementCount < returnArr.length) {
                        durationCount += 1;
                        getAllDurations();
                        responseCallback(returnArr, false);
                    } else {
                        responseCallback(returnArr, true);
                    }
                }
            })
            .catch(() => {
                RegisterNotification("Network Error: Failed to Retrieve Playlist Information", "error");
                responseCallback(undefined, true);
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
                if (controller.current.signal.aborted) return;
                returnArr = [...returnArr, ...resp.result.items.map(parsePlaylistItemJSON)];
                if (resp.result.nextPageToken) {
                    responseCallback(returnArr, false);
                    addPage(resp.result.nextPageToken);
                } else {
                    responseCallback(returnArr, false);
                    getAllDurations();
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
    controller: Ref<AbortController>,
    responseCallback: (video: VideoInfo) => void
): void {
    gapi.client
        .request({
            path: "https://www.googleapis.com/youtube/v3/videos",
            params: {
                part: "snippet,contentDetails",
                id: videoID
            }
        })
        .then(resp => {
            if (resp.result.items.length === 1 && !controller.current.signal.aborted)
                responseCallback(parseVideoJSON(resp.result.items[0]));
        })
        .catch(() => {
            RegisterNotification("Network Error: Failed to Retrieve Video Information", "error");
        });
}

export function RequestPlaylist(
    playlistID: string,
    controller: Ref<AbortController>,
    responseCallback: (playlist: PlaylistInfo) => void
): void {
    gapi.client
        .request({
            path: "https://www.googleapis.com/youtube/v3/playlists",
            params: {
                part: "snippet,contentDetails",
                id: playlistID
            }
        })
        .then(resp => {
            if (resp.result.items.length === 1 && !controller.current.signal.aborted)
                responseCallback(parsePlaylistJSON(resp.result.items[0]));
        })
        .catch(() => {
            RegisterNotification("Network Error: Failed to Retrieve Playlist Information", "error");
        });
}

export function SearchVideo(
    query: string,
    controller: Ref<AbortController>,
    responseCallback: (items: VideoInfo[]) => void
): void {
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
            if (!controller.current.signal.aborted) responseCallback(resp.result.items.map(parseSearchVideoJSON));
        })
        .catch(() => {
            RegisterNotification("Network Error: Failed to Retrieve Video Information", "error");
        });
}
