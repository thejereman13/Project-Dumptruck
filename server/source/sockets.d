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
		while(socket.connected) {
			const s = r.waitForMessage();
			if (socket.connected) {
				socket.send(s);
			}
		}
		writeln("Socket Disconnected");
	});

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
