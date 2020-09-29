module sockets;
import vibe.vibe;
import vibe.http.websockets;
import vibe.core.sync;
import std.stdio;
import std.uuid;
import std.algorithm;

import room;

struct Message {
	string message;
	UUID[] targets;
}

void handleWebsocketConnection(scope WebSocket socket) {
	const long roomID = socket.request.queryString.to!long;
	writeln("New Socket for Room: ", roomID);
	UUID userID = UUID.init;
	auto session = (cast(HTTPServerRequest)(socket.request)).session;
	if (session) {
		userID = session.get!UUID("clientID");
	}
	Room r = getOrCreateRoom(roomID, userID);
	const Json userInfo = r.addUser(userID);
	const UUID id = userInfo["ID"].get!UUID;
	socket.send(userInfo.toString());
	auto eventWait = runTask({
		size_t lastMessage = r.latestMessage;
		while(socket.connected) {
			const size_t newLatest = r.waitForMessage(socket, lastMessage);
			const messages = r.retrieveLatestMessages(lastMessage, newLatest);
			if (socket.connected) {
				foreach(s; messages) {
					if (s.targets.length == 0 || s.targets.any!((s) => s == id))
						socket.send(s.message);
				}
			}
			lastMessage = newLatest;
		}
	});

	scope(exit) {
		socket.close();
		eventWait.joinUninterruptible();
	}

	while(socket.waitForData()) {
		if (r.activeUser(id)) {
			r.receivedMessage(id, socket.receiveText());
		} else {
			socket.close(1000, "User Timed Out");
		}
	}
	eventWait.join();
	r.removeUser(id);
}
