import WebSocket from "ws";
import { Request } from "express";
import { getOrCreateRoom } from "./room";
import { sleep } from "./utils";

export async function handleWebsocketConnection(socket: WebSocket, req: Request): Promise<void> {
	const roomID = Number(req.query["room"]);
	if (Number.isNaN(roomID)) {
		socket.close();
		return;
	}
	const r = await getOrCreateRoom(roomID);
	let counter = 0;
	while (!r.initialized) {
		sleep(100);
		if (counter++ > 20) {
			socket.close();
			return;
		}
	}
	if (!r.constructed) {
		socket.close();
		return;
	}
	const userInfo = await r.addUser(req.session["clientID"] ?? "");
	if (!userInfo) {
		socket.close();
		return;
	}
	socket.on("close", () => {
		r.removeUser(userInfo.ID);
		r.messageQueue.removeClientSocket(userInfo.ID, socket);
	});
	socket.on("message", (msg) => {
		r.receivedMessage(userInfo.ID, msg.toString());
	});
	if (socket.readyState === socket.OPEN) {
		socket.send(JSON.stringify(userInfo));
		r.messageQueue.addClientSocket(userInfo.ID, socket);
	}
}
