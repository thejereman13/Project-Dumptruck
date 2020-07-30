module sockets;
import vibe.vibe;
import vibe.http.websockets;
import vibe.core.sync;
import std.stdio;
import std.uuid;

import room;

void setupSockets() {
	alertEvent = createManualEvent();
}

void sendCommand(Json comm) {
	comm["type"] = "command";
	latestAlert = (latestAlert + 1) % alerts.length;
    alerts[latestAlert] = comm.toString();
    alertEvent.emit();
}
LocalManualEvent alertEvent;
size_t waitForAlert(size_t lastAlert) {
	while (lastAlert == latestAlert)
		alertEvent.wait();
	return latestAlert;
}
string[32] alerts;
shared size_t latestAlert = 0;

void handleWebsocketConnection(scope WebSocket socket) {
	const long roomID = socket.request.queryString.to!long;
	writeln("New Socket for Room: ", roomID);
	Room r = getOrCreateRoom(roomID);
	const Json userInfo = r.addUser();
	const UUID id = userInfo["ID"].get!UUID;
	socket.send(userInfo.toString());
	auto eventWait = runTask({
		size_t lastMessage = r.latestMessage;
		while(socket.connected) {
			const size_t newLatest = r.waitForMessage(lastMessage);
			const messages = r.retrieveLatestMessages(lastMessage, newLatest);
			if (socket.connected) {
				foreach(s; messages) {
					socket.send(s);
				}
			}
			lastMessage = newLatest;
		}
		writeln("Socket Disconnected");
	});

	scope(exit) {
		socket.close();
		eventWait.joinUninterruptible();
	}

	while(socket.waitForData()) {
		if (r.activeUser(id)) {
			r.receivedMessage(id, socket.receiveText());
		} else {
			writeln("Inactive User: ", id);
			socket.close(1000, "User Timed Out");
		}
	}
	eventWait.join();
	r.removeUser(id);
}
