module message;

import vibe.core.sync;
import vibe.core.log;
import vibe.data.json;
import vibe.http.websockets;
import std.uuid;

import std.stdio;

struct Message {
	string message;
	UUID[] targets;
}

enum MessageType {
    Sync = "sync", // Server synchronizing connected clients
    Error = "error", // Server responding with an error code
    Ping = "ping", // Client updating connection status
    UserJoin = "userJoined", // Client joining the room
    UserLeft = "userLeft", // Client leaving the room
    UserList = "userList", // Server updating clients with the current list
    UserReady = "userReady", // Client has loaded the next video
    UserError = "userError", // Client has encountered a playback error
    Play = "play", // Server starting playback, Client requesting playback
    Pause = "pause", // Server pausing playback, Client requesting pause
    Skip = "skip", // Client requesting the next video
    Video = "video", // Server setting the active Client video
    Init = "init", // Server sending all initialization info
    Room = "room", // Server sending all room information
    QueueAdd = "addQueue", // Client adding a video id to queue
    QueueMultiple = "allQueue", // Client adding multiple videos
    QueueRemove = "removeQueue", // Client removing a video id from queue
    QueueClear = "clearQueue", // Client removing all of a users' videos
    QueueOrder = "orderQueue", // Server updating the client playlist
    QueueReorder = "reorderQueue", // Client reordering a users' videos
    UserOrder = "userQueue", // Server updating the room user queue order
    RoomSettings = "settings", // Admin updating the room settings
    AdminAdd = "addAdmin", // Admin adding another admin
    AdminRemove = "removeAdmin" // Admin removing another admin
}

final class MessageQueue {
    private LocalManualEvent messageEvent;
    public size_t latestMessage = 0;
    private Message[256] messageQueue;

    private bool running = false;

    this() {
        messageEvent = createManualEvent();
        running = true;
    }

    ~this() {
        stop();
    }

    public void stop() {
        running = false;
        messageEvent.emit();
    }

    /* Posting Messages to clients */

    @trusted nothrow void postMessage(MessageType type, string msg = "", UUID[] targetUsers = [], string key = "data") {
        if (!running) return;
        try {
            Json j = Json.emptyObject;
            j["type"] = type;
            if (msg.length > 0 && key.length > 0) j[key] = msg;
            latestMessage = (latestMessage + 1) % messageQueue.length;
            messageQueue[latestMessage] = Message(j.toString(), targetUsers);
            messageEvent.emit();
        } catch (Exception e) {
            logException(e, "Failed to send Websocket Message");
        }
    }

    @trusted nothrow void postJson(MessageType type, Json msg, UUID[] targetUsers = [], string key = "data") {
        if (!running) return;
        try {
            Json j = Json.emptyObject;
            j["type"] = type;
            j[key] = msg;
            latestMessage = (latestMessage + 1) % messageQueue.length;
            messageQueue[latestMessage] = Message(j.toString(), targetUsers);
            messageEvent.emit();
        } catch (Exception e) {
            logException(e, "Failed to send Websocket Json");
        }
    }
    @trusted nothrow void postSerializedJson(T)(MessageType type, T obj) {
        try {
            postJson(type, serializeToJson(obj));
        } catch (Exception e) {
            logException(e, "Failed to serialize Object for " ~ type);
        }
    }

    public void pingEvent() {
        messageEvent.emit();
    }

    public size_t waitForMessage(WebSocket socket, size_t lastMessage) {
        while (running && socket.connected && lastMessage == latestMessage) {
            messageEvent.wait();
        }
        return latestMessage;
    }
    public Message[] retrieveLatestMessages(size_t last, size_t latest) {
        if (!running) return [];
        const wrappedLast = (last + 1) % messageQueue.length;
        const wrappedLatest = (latest + 1);
        Message[] arr;
        if (wrappedLast <= wrappedLatest) {
            arr ~= messageQueue[wrappedLast .. wrappedLatest];
        } else if (wrappedLast > wrappedLatest) {
            arr ~= messageQueue[wrappedLast .. $];
            arr ~= messageQueue[0 .. wrappedLatest];
        }
        return arr;
    }
}