import { h, JSX } from "preact";
import { useState, useEffect } from "preact/hooks";
import { SiteUser } from "../../utils/BackendTypes";
import { GetCurrentUser, ClearUserInfo } from "../../utils/RestCalls";
import { route } from "preact-router";
import * as style from "./style.css";
import { useAbortController } from "../../components/AbortController";
import { GoogleLogout } from "react-google-login";
import { CLIENTID } from "../../constants";
import { useGAPIContext } from "../../utils/GAPI";

export function Profile(): JSX.Element {
    const [user, setUser] = useState<SiteUser | null>(null);

    const controller = useAbortController();

    const gapi = useGAPIContext();

    useEffect(() => {
        GetCurrentUser(controller).then(usr => {
            if (usr !== null && usr.id !== undefined) setUser(usr);
            else route("/login");
        });
    }, [controller]);

    function onSignOut(): void {
        gapi?.forceSignOut();
        ClearUserInfo();
        route("/");
    }

    function onSignOutFailure(): void {
        console.warn("Sign In Failure");
    }

    return (
        <div class={style.root}>
            {user === null ? (
                <div>
                    <h2>Not Currently Signed In</h2>
                    <h3>Please Wait for Redirect to SignIn Page</h3>
                </div>
            ) : (
                <div>
                    <h2>{`Signed in as ${user.name}`}</h2>
                    <br />
                    <div class="mui--text-title">Disconnect Account:</div>
                    <br />
                    <GoogleLogout
                        clientId={CLIENTID}
                        onFailure={onSignOutFailure}
                        onLogoutSuccess={onSignOut}
                        theme="dark"
                        buttonText="Disconnect Account"
                    />
                    <div class="mui--text-body1">
                        WARNING: All user preferences on this website will also be deleted!
                    </div>
                    <div class="mui--text-body1">
                        Your existing Google/Youtube account and associated data will not be impacted.
                    </div>
                </div>
            )}
        </div>
    );
}
