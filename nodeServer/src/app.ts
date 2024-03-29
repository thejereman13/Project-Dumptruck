import express from "express";
import expressWS from "express-ws";
import session from "express-session";
import connectRedis from "connect-redis";
import Redis from "ioredis";
import fs from "fs";
import https from "https";
import { v4 as randomUUID } from "uuid";

import { readConfigFile, server_configuration, ConfigItems } from "./configuration";
import { authorizeAPIUser, getUserLogin, refreshAPIUser, userLogin, userLogout } from "./authentication";
import { createNewRoom, getRoomSettings, getOpenRooms, getRoomPlaying, getRoomHistory, removeRoom, listAllRooms } from "./site_room";
import { clearUserInfo, getPublicUserInfo, getUserInfo, removeRecentRoom } from "./site_user";
import { handleWebsocketConnection } from "./sockets";

readConfigFile();

const redisStore = connectRedis(session);
const redisClient = new Redis();

const eApp = express();

const pKey = fs.readFileSync(server_configuration[ConfigItems.Key]);
const certKey = fs.readFileSync(server_configuration[ConfigItems.Cert]);
const server = https.createServer({
	key: pKey,
	cert: certKey,
}, eApp);

const app = expressWS(eApp, server).app;

app.use(express.json());
app.use(session({
	secret: randomUUID(),
	resave: false,
	saveUninitialized: false,
	cookie: { secure: true },
	store: new redisStore({ client: redisClient })
}));

const WebServerVersion = "0.12.0";

app.ws("/api/ws", handleWebsocketConnection);
app.post("/api/login", userLogin);
app.get("/api/login", getUserLogin);
app.post("/api/logout", userLogout);
app.post("/api/auth", authorizeAPIUser);
app.get("/api/authRefresh", refreshAPIUser);
// router.get("/api/video/:id", &videoInfoRequest);
app.get("/api/user", getUserInfo);
app.delete("/api/user", clearUserInfo);
app.get("/api/user/:id", getPublicUserInfo);
app.delete("/api/userHistory/:id", removeRecentRoom);

app.get("/api/room/:id", getRoomSettings);
app.post("/api/room/:id", createNewRoom);
app.delete("/api/room/:id", removeRoom);

app.get("/api/rooms", getOpenRooms);
app.get("/api/playing/:id", getRoomPlaying);
app.get("/api/history/:id", getRoomHistory);


console.info("Starting Web Server: " + WebServerVersion + " on port ", server_configuration[ConfigItems.Port]);
server.listen(Number(server_configuration[ConfigItems.Port]));

setInterval(listAllRooms, 60 * 1000);
