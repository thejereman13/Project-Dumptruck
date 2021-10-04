import { h, JSX } from "preact";
import { route } from "preact-router";
import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from "react-google-login";
import { CLIENTID } from "../../constants";
import { useGAPIContext } from "../../utils/GAPI";
import { useEffect } from "preact/hooks";
import { RegisterNotification } from "../../components/Notification";
import { css } from "@linaria/core";

const style = {
    profile: css`
        padding: 56px 20px;
        min-height: 100%;
        width: 100%;
    `,
};

export function Login(): JSX.Element {
    const gapi = useGAPIContext();

    function onSignIn(resp: GoogleLoginResponse | GoogleLoginResponseOffline): void {
        gapi?.forceSignIn(resp);
        route("/");
    }

    useEffect(() => {
        if (gapi?.getUser() != null) {
            route("/");
        }
    }, [gapi]);

    function onSignInFailure(error: any): void {
        console.warn("Sign In Failure", error);
        RegisterNotification("Failed to Sign in with Google. \n Check Same-Site Cookies and Try Again.", "error");
        gapi?.forceSignOut();
    }

    return (
        <div class={style.profile}>
            <h2>You are not currently signed in</h2>
            <h3>Please Authenticate with Google</h3>
            <GoogleLogin
                clientId={CLIENTID}
                scope="https://www.googleapis.com/auth/youtube.readonly"
                onSuccess={onSignIn}
                onFailure={onSignInFailure}
                isSignedIn={true}
                cookiePolicy="single_host_origin"
                responseType="id_token permission"
                theme="dark"
            />
        </div>
    );
}
