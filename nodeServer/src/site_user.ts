import { v4 as randomUUID } from "uuid";
import { clearUserData, findGIDUser, getUserData, setUserData, setUserGID } from "./database";
import { Request, Response } from "express";

export interface SiteUser {
    id: string;
    googleID: string;
    name: string;
    email: string;
    recentRooms: number[];
}

function constructSiteUser(data: string): SiteUser | null {
    const uData = JSON.parse(data);
    if (uData && Object.keys(uData).length > 0) return uData as SiteUser;
    return null;
}

export async function makeSiteUser(googleID: string, name: string, email: string): Promise<SiteUser> {
    const foundID = await findGIDUser(googleID);
    if (foundID) {
        const data = constructSiteUser(await getUserData(foundID));
        if (data) return data;
    }
    const newUser: SiteUser = {
        id: randomUUID(),
        googleID,
        name,
        email,
        recentRooms: []
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

export async function getSiteUser(clientID: string): Promise<SiteUser | null> {
    if (!clientID) return null;
    return constructSiteUser(await getUserData(clientID));
}

export async function getUserInfo(req: Request, res: Response): Promise<void> {
    const id = req.session["clientID"];
    if (id) {
        const data = await getUserData(id);
        res.status(201).send(data);
        return;
    }
    res.status(400).send("{}");
}

export async function clearUserInfo(req: Request, res: Response): Promise<void> {
    const id = req.session.clientID;
    if (id) {
        if (await clearUserData(id)) {
            res.status(201).send("{}");
            return;
        }
    }
    res.status(401).send("{}");
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
    res.status(400).send("{}");
}