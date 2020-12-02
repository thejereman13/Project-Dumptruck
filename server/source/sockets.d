module sockets;
import vibe.vibe;
import vibe.http.websockets;
import std.stdio;
import std.uuid;
import std.algorithm;
import std.datetime;

import room;

void handleWebsocketConnection(scope WebSocket socket) {
	const long roomID = socket.request.queryString.to!long;
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
		size_t lastMessage = r.messageQueue.latestMessage;
		while(socket.connected && r.constructed) {
			const size_t newLatest = r.messageQueue.waitForMessage(socket, lastMessage);
			const messages = r.messageQueue.retrieveLatestMessages(lastMessage, newLatest);
			if (socket.connected) {
				foreach(s; messages) {
					if (s.targets.length == 0 || s.targets.any!((t) => t == id))
						socket.send(s.message);
				}
			}
			lastMessage = newLatest;
		}
	});

	scope(exit) {
		if (socket.connected)
			socket.close();
		eventWait.joinUninterruptible();
	}

	while(socket.waitForData()) {
		if (!socket.connected) break;
		if (r.constructed && r.activeUser(id)) {
			r.receivedMessage(id, socket.receiveText());
		} else {
			socket.close(1000, "User Timed Out");
		}
	}
	eventWait.join();
	r.removeUser(id);
}
