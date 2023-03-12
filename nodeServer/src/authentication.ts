import { Request, Response } from "express";
import { CredentialRequest,  OAuth2Client } from "google-auth-library";
import fetch from "node-fetch";
import { server_configuration } from "./configuration";
import { CLIENT_ID } from "./constants";
import { getSiteUser, makeSiteUser, updateUserAuth } from "./site_user";

export function checkUserLogin(req: Request, res: Response): void {
    if (!req.session) {
        res.status(401).send("");
        res.redirect("/");
    } else {
        //writeln("Authenticated Request");
    }
}
// const REDIRECT_URI = "https://localhost:8080";
const REDIRECT_URI = "https://krono.us";

let client: OAuth2Client | undefined;

async function validateToken(token: string, req: Request, response: Response) {
    if (!client) {
        client = new OAuth2Client(CLIENT_ID, server_configuration.oauth_secret, REDIRECT_URI)
    }
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (payload && payload.sub && payload.aud === CLIENT_ID) {
            console.log(payload);
            const user = await makeSiteUser(payload.sub, payload.name ?? "User", payload.email ?? "", payload.picture ?? "");
            req.session["clientID"] = user.id;
            console.log("Authenticated", user.email);
            user.refresh_token = "";
            response.status(201).send(JSON.stringify(user));
            return;
        } else {
            console.error("Invalid User Payload");
        }
    } catch (e) {
        console.error(e, "Failed to Verify User Token");
    }
    response.sendStatus(401);
}

export async function validateExistingLogin(req: Request, res: Response): Promise<void> {
    const user = await getSiteUser(req.session?.clientID ?? "");
    if (user && user.googleID.length > 0 && req.body["clientId"] === CLIENT_ID) {
        res.status(200).send(JSON.stringify(user));
    } else {
        req.session.destroy(() => {
            res.sendStatus(401);
        });
    }
}

//Authenticates and logs in a user
export async function userLogin(req: Request, res: Response): Promise<void> {
    if (req.session && req.session.clientID) {
        await validateExistingLogin(req, res);
    } else {
        const credential = req.body["credential"];
        if (credential) {
            await validateToken(credential, req, res);
        } else {
            res.sendStatus(400);
        }
    }
    // authenticate with google using token id, associate the api id with the session
    // new(?) websocket sessions read a valid api id to determine if guest
    // or can find the DB information for a logged-in user
}

//Returns the username of the current session if logged in
export function getUserLogin(req: Request, res: Response): void {
    const currentUser: { User: string | null } = {
        User: null,
    };

    if (req.session) {
        currentUser.User = req.session["username"];
    }
    res.status(200).send(currentUser);
}

//Logs out any user session
export function userLogout(req: Request, res: Response): void {
    if (req.session) {
        req.session.destroy(() => {
            res.sendStatus(201);
        });
    } else {
        res.sendStatus(200);
    }
}

interface GoogleOAuthResponse {
    code: string;
    scope: string;
    authuser: string;
    prompt: string;
}

export async function authorizeAPIUser(req: Request, res: Response): Promise<void> {
    const user = await getSiteUser(req.session?.clientID ?? "");
    if (user) {
        const auth = req.body as GoogleOAuthResponse;
        if (auth) {
            if (!client) {
                client = new OAuth2Client(CLIENT_ID, server_configuration.oauth_secret, REDIRECT_URI)
            }
            try {
                const { tokens } = await client.getToken(auth.code);
                if (tokens.access_token && tokens.expiry_date && tokens.refresh_token) {
                    await updateUserAuth(user.id, tokens.access_token, tokens.refresh_token, tokens.expiry_date);
                    const updatedUser = await getSiteUser(user.id);
                    if (updatedUser) {
                        updatedUser.refresh_token = "";
                        res.status(201).send(updatedUser);
                        return;
                    } else {
                        console.error("Failed to Authorized User: ", user.id);
                    }
                } else {
                    console.error("GAUTH returned ill-formed tokens");
                }
            } catch (e) {
                console.error("GAUTH Error", e);
            }
        }
        res.sendStatus(500);
    } else {
        res.sendStatus(401);
    }
}

export async function refreshAPIUser(req: Request, res: Response): Promise<void> {
    const user = await getSiteUser(req.session?.clientID ?? "");
    if (user) {
        const formBody = `client_id=${encodeURIComponent(CLIENT_ID)}&client_secret=${encodeURIComponent(server_configuration.oauth_secret)}&refresh_token=${encodeURIComponent(user.refresh_token)}&grant_type=refresh_token`;
        try {
            const startingTime = new Date().getTime();
            const resp = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formBody,
            });
            if (resp.ok) {
                const tokens = await resp.json() as CredentialRequest;
                if (tokens.access_token && tokens.expires_in) {
                    await updateUserAuth(user.id, tokens.access_token, user.refresh_token, startingTime + tokens.expires_in * 1000);
                    const updatedUser = await getSiteUser(user.id);
                    if (updatedUser) {
                        updatedUser.refresh_token = "";
                        res.status(201).send(updatedUser);
                        return;
                    } else {
                        console.error("Failed to Update User Auth: ", user.id);
                    }
                } else {
                    console.log("Failed to update User with tokens", tokens);
                }
                res.status(200);
                return;
            }
        } catch (e) {
            console.error("Token Refresh Error", e);
            res.sendStatus(500);
            return;
        }
    } else {
        res.sendStatus(401);
    }
}
