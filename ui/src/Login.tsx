import { createSignal, JSX, onCleanup, onMount, Show } from "solid-js";
import { CLIENTID } from "./constants";
import { RegisterNotification } from "./components/Notification";
import { css } from "solid-styled-components";
import { SiteUser } from "./utils/BackendTypes";
import { GetCurrentUser, LogoutUser, ClearUserInfo } from "./utils/RestCalls";

const style = {
    profile: css`
        padding: 56px 20px;
        min-height: 100%;
        width: 100%;
        margin-top: var(--navbar-height);
    `,
};

async function revokeToken(token: string): Promise<void> {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
}

const EXPIRY_THRESHOLD = 10 * 60 * 1000; // 10 minutes
function isTokenAlmostExpired(user: SiteUser): boolean {
    const almostTime = new Date().getTime() + EXPIRY_THRESHOLD;
    return user.expiry_date < almostTime;
}

async function renewToken(): Promise<SiteUser | null> {
    try {
        const res = await fetch("/api/authRefresh");
        const user = await res.json();
        if (user.id && user.id.length > 0) {
            return user as SiteUser;
        }
    } catch (e) {
        console.error("Failed to Refresh Token", e);
    }
    return null;
}

async function postAuth(response: unknown): Promise<SiteUser | null> {
    try {
        const res = await fetch("/api/auth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(response),
        });
        const user = await res.json();
        if (user.id && user.id.length > 0) {
            return user as SiteUser;
        }
    } catch (e) {
        console.error("Failed to Refresh Token", e);
    }
    return null;
}

// global user state across the whole app
export const [siteUser, setSiteUser] = createSignal<SiteUser | null>(null);

export function requestYoutubeScope(user: SiteUser): void {
    // if we want scope but don't have any tokens yet, request it from the user
    if (!user.access_token || user.expiry_date === 0) {
        const client = google.accounts.oauth2.initCodeClient({
            client_id: CLIENTID,
            scope: "https://www.googleapis.com/auth/youtube.readonly",
            ux_mode: "popup",

            callback: (resp) => {
                postAuth(resp).then((userR) => {
                    if (userR) {
                        setSiteUser(userR);
                    } else {
                        RegisterNotification("Failed to Grant Youtube Access.\nPlease Try Again.", "error");
                    }
                });
            },
        });
        client.requestCode();
    }
}

export async function postLogout() {
    google.accounts.id.disableAutoSelect();
    const res = await LogoutUser();
    if (res) {
        console.log("Logged Out");
        setSiteUser(null);
    } else {
        RegisterNotification("Failed to Log Out", "error");
    }
}

export async function refreshSiteUser() {
    // see also renewUser below
    GetCurrentUser().then((user) => {
        if (user && user.googleID && user.access_token) {
            setSiteUser(user);
        }
    });
}

export function useAuthenticatedUser() {
    const postLogin = (response: google.accounts.id.CredentialResponse) => {
        try {
            fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(response),
            }).then(async (userResp) => {
                const j: SiteUser = await userResp.json();
                if (j !== undefined && j.id !== undefined && j.id.length > 0) {
                    console.log("User is: ", j);
                    setSiteUser(j);
                }
            });
        } catch (e) {
            console.warn("Failed to Login on Server", e);
            RegisterNotification("Failed to Login", "error");
        }
    };

    google.accounts.id.initialize({
        client_id: CLIENTID,
        callback: postLogin,
        auto_select: true,
    });

    const renewUser = () =>
        GetCurrentUser().then((user) => {
            // see also refreshSiteUser() above
            if (user && user.googleID && user.access_token) {
                if (isTokenAlmostExpired(user)) {
                    renewToken().then(setSiteUser);
                } else {
                    setSiteUser(user);
                }
            } else {
                google.accounts.id.prompt();
            }
        });

    let userRefreshTimeout: ReturnType<typeof setTimeout> | null = null;

    onMount(() => {
        renewUser();
        userRefreshTimeout = setInterval(() => {
            renewUser();
        }, EXPIRY_THRESHOLD);
    });

    onCleanup(() => {
        if (userRefreshTimeout) {
            clearInterval(userRefreshTimeout);
        }
    });
}

export function Login(): JSX.Element {
    onMount(() => {
        google.accounts.id.renderButton(document.getElementById("GoogleSignInButton")!, {
            theme: "filled_blue",
            size: "large",
            type: "standard",
        });
    });

    return (
        <div class={style.profile}>
            <Show
                when={!siteUser()}
                fallback={
                    <div>
                        <h2>Logged in as {siteUser()!.name}</h2>
                    </div>
                }
            >
                <div>
                    <h2>You are not currently signed in</h2>
                    <h3>Please Authenticate with Google</h3>
                    <h3>Or refresh the page</h3>
                    <div style={{ display: "inline-flex" }} id="GoogleSignInButton" />
                </div>
            </Show>
            <Show when={siteUser()}>
                <button class="btn btn-primary mr-2" id="g_id_logout" onClick={postLogout}>
                    Sign Out
                </button>
            </Show>
            <Show when={siteUser() && !siteUser()?.access_token}>
                <button
                    class="btn btn-primary mr-2"
                    onClick={() => {
                        if (siteUser()) requestYoutubeScope(siteUser()!);
                    }}
                >
                    Grant YouTube Access
                </button>
            </Show>
            <Show when={siteUser()?.access_token}>
                <button
                    class="btn btn-primary mr-2"
                    onClick={async () => {
                        await revokeToken(siteUser()?.access_token ?? "");
                        await postLogout();
                        ClearUserInfo();
                    }}
                >
                    Revoke Youtube Access
                </button>
            </Show>
        </div>
    );
}
