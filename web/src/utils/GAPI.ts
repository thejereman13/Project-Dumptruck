import { useGoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from "react-google-login";

export function useGoogleClientAPI(loginCallback: (status: boolean) => void): void {
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
            });
            window.gapi.load("client", () => {
                loginCallback(true);
            });
        },
        onFailure: () => {
            console.warn("Failed to Load Login");
            loginCallback(false);
        },
        isSignedIn: true,
        cookiePolicy: "single_host_origin",
        responseType: "id_token permission"
    });
}
