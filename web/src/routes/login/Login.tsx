import { h, JSX } from "preact";
import { route } from "preact-router";
import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from "react-google-login";
import { CLIENTID } from "../../constants";
import * as style from "./style.css";
import { useGAPIContext } from "../../utils/GAPI";

export function Login(): JSX.Element {
    const gapi = useGAPIContext();

    function onSignIn(resp: GoogleLoginResponse | GoogleLoginResponseOffline): void {
        gapi?.forceSignIn(resp);
        route("/");
    }

    function onSignInFailure(error: any): void {
        console.warn("Sign In Failure", error);
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
