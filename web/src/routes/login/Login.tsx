import { h, JSX } from "preact";
import { route } from "preact-router";
import { GoogleLogin } from "react-google-login";
import { CLIENTID } from "../../constants";
import * as style from "./style.css";

export function Login(): JSX.Element {
    function onSignIn(): void {
        route("/");
    }

    function onSignInFailure(error: any): void {
        console.warn("Sign In Failure", error);
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
            />
        </div>
    );
}
