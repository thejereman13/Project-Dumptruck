import { FunctionalComponent, h } from "preact";
import { route } from "preact-router";
import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from "react-google-login";
import * as style from "./style.css";

interface Props {
    user: string;
}

const Profile: FunctionalComponent<Props> = () => {
    function onSignIn(resp: GoogleLoginResponse | GoogleLoginResponseOffline): void {
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
                clientId="841595651790-s771569jg29jlktsq4ac4nk56fg0coht.apps.googleusercontent.com"
                scope="https://www.googleapis.com/auth/youtube.readonly"
                onSuccess={onSignIn}
                onFailure={onSignInFailure}
                isSignedIn={true}
                cookiePolicy="single_host_origin"
                responseType="id_token permission"
            />
        </div>
    );
};

export default Profile;
