import { Request, Response } from "express";
import { Video } from "./room/video";
import { setRoomSettings, defaultDBSettings, peekRoomInformation, removeRoomInfo, getAllUsers, setRoomAdmins } from "./database";
import { Room } from "./room/room";
import { removeRecentRoomToUser } from "./site_user";

export async function getRoomSettings(req: Request, res: Response): Promise<void> {
    const id = Number(req.params["id"]);
    const room = await peekRoomInformation(id);
    if (room)
        res.status(201).send(JSON.stringify(room));
    else
        res.sendStatus(404);
}

export interface PublicRoomPreview {
    currentVideo: Video | null;
    userCount: number;
}

export function getRoomPlaying(req: Request, res: Response): void {
    const id = Number(req.params["id"]);
    const r = getRoom(id);
    if (r) {
        const rm: PublicRoomPreview = {
            currentVideo: r.getPlaying(),
            userCount: r.getUserCount()
        };
        res.status(200).send(JSON.stringify(rm));
    } else {
        res.sendStatus(404);
    }
}

export async function getRoomHistory(req: Request, res: Response): Promise<void> {
    const id = Number(req.params["id"]);
    const ri = await peekRoomInformation(id);
    if (ri) {
        res.status(200).send(JSON.stringify(ri.history));
    } else {
        res.sendStatus(404);
    }
}

export function getOpenRooms(_: Request, res: Response): void {
    const rooms = getActiveRooms();
    res.status(200).send(JSON.stringify(rooms));
}

export async function createNewRoom(req: Request, res: Response): Promise<void> {
    let id = Number(req.params["id"]);
    const userID = req.session["clientID"];
    console.log(userID);
    if (!userID || Number.isNaN(id)) {
        res.sendStatus(400);
        return;
    }
    if (id === 0) {
        // if id is 0, generated a random (available) id
        do {
            id = getNextRoomID();
        } while (await peekRoomInformation(id));
    }
    const info = await peekRoomInformation(id);
    if (id > 0 && (info === null || info.admins.length === 0)) {
        // new room
        const set = defaultDBSettings();
        set.name = "Room " + id;
        // setRoomSettings will parse out any invalid info, so we assign and serialize again just to be safe
        await setRoomSettings(id, set);
        await setRoomAdmins(id, [userID]);
        console.log(await peekRoomInformation(id));
        res.status(201).send(JSON.stringify(id));
    } else {
        res.sendStatus(400);
    }
}

export async function removeRoom(req: Request, res: Response): Promise<void> {
    const id = Number(req.params["id"]);
    const userID = req.session["clientID"];
    if (!userID || Number.isNaN(id)) {
        res.sendStatus(400);
        return;
    }
    const info = await peekRoomInformation(id);
    if (!info?.admins.includes(userID)) {
        res.sendStatus(401);
        return;
    }
    await removeRoomInfo(id);
    const users = await getAllUsers();
    for (const u of users)
        await removeRecentRoomToUser(u, id);
    destroyRoom(id);
    res.sendStatus(200);
}

const roomList: Map<number, Room> = new Map<number, Room>();

export async function getOrCreateRoom(roomID: number): Promise<Room> {
    const lr = roomList.get(roomID);
    if (lr) return lr;

    const r = new Room(roomID);
    await r.init();
    roomList.set(roomID, r);
    return r;
}

export function getRoom(roomID: number): Room | null {
    if (Number.isNaN(roomID)) return null;
    return roomList.get(roomID) ?? null;
}

export function getActiveRooms(): number[] {
    return new Array(...roomList.entries()).filter(([, r]) => r.roomLoopRunning && r.settings.publicVisibility).map(([n]) => n);
}

export function destroyRoom(roomID: number): void {
    const r = roomList.get(roomID);
    if (!r) return;
    console.info("Deallocating Room " + roomID);
    r.destroy();
    roomList.delete(roomID);
}

const maxRoom = 1 << 20; // 1048576
export function getNextRoomID(): number {
    return Math.round(Math.random() * maxRoom);
}
