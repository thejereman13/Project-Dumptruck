import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { getSiteUser, makeSiteUser } from "./site_user";

export function checkUserLogin(req: Request, res: Response): void {
    if (!req.session) {
        res.status(401).send("");
        res.redirect("/");
    } else {
        //writeln("Authenticated Request");
    }
}

const CLIENT_ID = "907313861790-8u0up50k8acr0cqlt654lbi7dmo4aafc.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

async function validateToken(clientId: string, token: string, req: Request, response: Response) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (payload && payload.sub === clientId) {
            const user = await makeSiteUser(payload.sub, payload.name ?? "User", payload.email ?? "");
            req.session["clientID"] = user.id;
            response.status(200).send(JSON.stringify(user));
        }
    } catch (e) {
        console.error(e, "Failed to Verify User Token");
        response.sendStatus(401);
    }
}

export async function validateExistingLogin(req: Request, res: Response): Promise<void> {
    const user = await getSiteUser(req.session?.clientID ?? "");
    if (user && user.googleID.length > 0 && req.body["clientId"] === user.googleID) {
        res.status(201).send(JSON.stringify(user));
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
        await validateToken(req.body["clientId"], req.body["token"], req, res);
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
