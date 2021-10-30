import WebSocket from "ws";
import { Request } from "express";
import { getOrCreateRoom } from "./site_room";
import { sleep } from "./utils";
import { MessageType } from "./room/message";

const USER_TIMEOUT = 30 * 1000;

export async function handleWebsocketConnection(socket: WebSocket, req: Request): Promise<void> {
	const roomID = Number(req.query["room"]);
	if (Number.isNaN(roomID)) {
		socket.close();
		return;
	}
	const r = await getOrCreateRoom(roomID);
	let counter = 0;
	while (!r.initialized) {
		await sleep(100);
		if (counter++ > 30) {
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

	let recentMessage = true; // give a free timeout interval upon initial disconnect
	const timeout = setInterval(() => {
		if (!recentMessage) {
			socket.close();
			clearInterval(timeout);
		}
		recentMessage = false;
	}, USER_TIMEOUT);

	socket.on("close", () => {
		// console.log("Socket Disconnected for ", userInfo.ID);
		r.removeUser(userInfo.ID);
		r.messageQueue.removeClientSocket(userInfo.ID, socket);
	});

	socket.on("message", (msg) => {
		const j = JSON.parse(msg.toString());
		if (typeof j === "object") {
			const type = j["t"] as MessageType | undefined;
			if (type) {
				recentMessage = true;
				if (type === MessageType.Ping) {
					r.messageQueue.postMessage(MessageType.Ping, "", [userInfo.ID], "");
				}
				r.receivedMessage(userInfo.ID, type, j);
			}
		}
	});
	if (socket.readyState === socket.OPEN) {
		socket.send(JSON.stringify(userInfo));
		r.messageQueue.addClientSocket(userInfo.ID, socket);
	}
}
