import fs from "fs";
import { Request, Response } from "express";
import { Video } from "./video";
import { setRoomSettings, defaultDBSettings, peekRoomInformation } from "./database";
import { getActiveRooms, getNextRoomID, getRoom } from "./room";
//Constant data values

//Server JSON configurations (constant per runtime)
export const server_configuration: Record<configItems, any> = {
    database_name: "DB",
    database_password: "",
    database_username: "",
    ssl_cert: "",
    ssl_key: "",
    web_dir: ".",
    web_port: "443",
    youtube_api_key: ""
};

export enum configItems {
    Port = "web_port",              //TCP port to use for website
    Dir = "web_dir",                //root directory for serving the website
    Cert = "ssl_cert",              //SSL certificate chain file name
    Key = "ssl_key",                //SSL private key file name
    DB_User = "database_username",  //username to use for the database
    DB_Pass = "database_password",  //password for the database
    DB_Name = "database_name",      //name of the database to connect to
    GAPI_Key = "youtube_api_key",   //API key used by the Youtube API v3
}

const configFileName = "server_configuration.json";

export function readConfigFile(): void {
    if (!fs.statSync(configFileName).isFile())
        throw "No Configuration File Present: server_configuration.json";
    const conf = fs.readFileSync(configFileName, "utf-8");
    const obj = JSON.parse(conf);
    Object.values(configItems).forEach((value) => {
        if (!(value in obj))
            throw "Configuration Item '" + value + "' is missing from the server_configuration.json file";
        server_configuration[value as configItems] = obj[value];
    });
}

export async function getRoomSettings(req: Request, res: Response): Promise<void> {
    const id = Number(req.params["id"]);
    const room = await peekRoomInformation(id);
    if (room)
        res.status(201).send(JSON.stringify(room));
    else
        res.status(404).send("{}");
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
        res.status(404).send("{}");
    }
}

export function getOpenRooms(_: Request, res: Response): void {
    const rooms = getActiveRooms();
    res.status(200).send(JSON.stringify(rooms));
}

export async function createNewRoom(req: Request,res: Response): Promise<void> {
    let id = Number(req.params["id"]);
    if (id === Number.NaN) {
        res.status(400).send("{}");
        return;
    }
    if (id === 0) {
        // if id is 0, generated a random (available) id
        do {
            id = getNextRoomID();
        } while (await peekRoomInformation(id));
    }
    const info = await peekRoomInformation(id);
    if (id > 0 && (info === null || info.settings.name.length === 0)) {
        // new room
        const set = defaultDBSettings();
        set.name = "Room " + id;
        // setRoomSettings will parse out any invalid info, so we assign and serialize again just to be safe
        await setRoomSettings(id, set);
        res.status(201).send(id);
    } else {
        res.status(400).send("{}");
    }
}
