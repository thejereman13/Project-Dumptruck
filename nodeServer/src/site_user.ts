import { v4 as randomUUID } from "uuid";
import { clearUserData, findGIDUser, getUserData, setUserData, setUserGID } from "./database";
import { Request, Response } from "express";

export interface SiteUser {
    id: string;
    googleID: string;
    name: string;
    email: string;
    recentRooms: number[];
    access_token: string;
    refresh_token: string;
    expiry_date: number;
    picture: string;
}

function constructSiteUser(data: string): SiteUser | null {
    const uData = JSON.parse(data);
    if (uData && Object.keys(uData).length > 0) return uData as SiteUser;
    return null;
}

export async function makeSiteUser(googleID: string, name: string, email: string, picture: string): Promise<SiteUser> {
    const foundID = await findGIDUser(googleID);
    if (foundID) {
        const data = constructSiteUser(await getUserData(foundID));
        if (data) {
            if (picture != data.picture) {
                data.picture = picture;
                setUserData(data.id, JSON.stringify(data));
            }
            return data;
        }
    }
    const newUser: SiteUser = {
        id: randomUUID(),
        googleID,
        name,
        email,
        picture,
        recentRooms: [],
        access_token: "",
        refresh_token: "",
        expiry_date: 0,
    };
    setUserData(newUser.id, JSON.stringify(newUser));
    setUserGID(newUser.id, googleID);
    return newUser;
}

export async function addRecentRoomToUser(clientID: string, roomID: number): Promise<void> {
    const data = constructSiteUser(await getUserData(clientID));
    if (data && data.googleID) {
        if (!data.recentRooms.includes(roomID)) {
            data.recentRooms.push(roomID);
        } else {
            const index = data.recentRooms.indexOf(roomID);
            data.recentRooms.splice(index, 1);
            data.recentRooms.push(roomID);
        }
        await setUserData(clientID, JSON.stringify(data));
    }
}

export async function updateUserAuth(clientID: string, access_token: string, refresh_token: string, expiry_date: number): Promise<void> {
    const data = constructSiteUser(await getUserData(clientID));
    if (data && data.googleID) {
        data.access_token = access_token;
        data.refresh_token = refresh_token;
        data.expiry_date = expiry_date;
        await setUserData(clientID, JSON.stringify(data));
    }
}

export async function removeRecentRoomToUser(clientID: string, roomID: number): Promise<void> {
    const data = constructSiteUser(await getUserData(clientID));
    if (data && data.googleID) {
        const index = data.recentRooms.indexOf(roomID);
        if (index >= 0)
            data.recentRooms.splice(index, 1);
        await setUserData(clientID, JSON.stringify(data));
    }
}

export async function getSiteUser(clientID: string): Promise<SiteUser | null> {
    if (!clientID) return null;
    return constructSiteUser(await getUserData(clientID));
}

export async function getUserInfo(req: Request, res: Response): Promise<void> {
    const id = req.session["clientID"];
    if (id) {
        const user = constructSiteUser(await getUserData(id));
        if (user) {
            user.refresh_token = "";
            res.status(201).json(user);
            return;
        }
    }
    res.sendStatus(400);
}

export async function clearUserInfo(req: Request, res: Response): Promise<void> {
    const id = req.session["clientID"];
    if (id) {
        if (await clearUserData(id)) {
            res.sendStatus(201);
            return;
        }
    }
    res.sendStatus(401);
}

export async function getPublicUserInfo(req: Request, res: Response): Promise<void> {
    const userID = req.params["id"];

    if (userID) {
        const u = constructSiteUser(await getUserData(userID));
        if (u) {
            // Remove sensitive Information
            u.googleID = "";
            u.email = "";
            res.status(201).send(JSON.stringify(u));
            return;
        }
    }
    res.sendStatus(400);
}

export async function removeRecentRoom(req: Request, res: Response): Promise<void> {
    const id = req.session["clientID"];
    const roomID = Number(req.params["id"]);
    if (id && !Number.isNaN(roomID)) {
        await removeRecentRoomToUser(id, roomID);
        res.sendStatus(201);
        return;
    }
    res.sendStatus(401);
}