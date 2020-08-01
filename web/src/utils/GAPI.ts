import { useGoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from "react-google-login";
import { SiteUser } from "./BackendTypes";
import { useRef, useContext, useState } from "preact/hooks";
import { createContext } from "preact";

export interface LoggedInUser extends SiteUser {
    profileURL: string;
}

export interface GAPIInfo {
    getUser: () => LoggedInUser | null;
    isAPILoaded: () => boolean;
}

// TODO: move to app-wide context that stores the necessary account info
export function useGoogleLoginAPI(): GAPIInfo {
    const [siteUser, setSiteUser] = useState<LoggedInUser | null>(null);
    const [isGAPILoaded, setAPILoaded] = useState<boolean>(false);

    useGoogleLogin({
        clientId: "841595651790-s771569jg29jlktsq4ac4nk56fg0coht.apps.googleusercontent.com",
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
