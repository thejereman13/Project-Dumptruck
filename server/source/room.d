module room;

import vibe.core.core;
import vibe.core.sync;
import vibe.core.log;
import vibe.data.json;
import core.time;
import std.uuid;
import std.algorithm;
import std.conv;
import std.array;
import std.exception;

import video;
import user;
import sockets;

import std.stdio;

enum MessageType {
    Sync = "sync", // Server synchronizing connected clients
    Error = "error", // Server responding with an error code
    Ping = "ping", // Client updating connection status
    UserJoin = "userJoined", // Client joining the room
    UserLeft = "userLeft", // Client leaving the room
    UserList = "userList", // Server updating clients with the current list
    Play = "play", // Server starting playback, Client requesting playback
    Pause = "pause", // Server pausing playback, Client requesting pause
    Video = "video", // Server setting the active Client video
    Init = "init", // Server sending all initialization info
    Room = "room", // Server sending all room information
    QueueAdd = "addQueue", // Client adding a video id to queue
    QueueRemove = "removeQueue", // Client removing a video id from queue
    QueueOrder = "orderQueue", // Server updating the client playlist
    UserOrder = "userQueue" // Server updating the room user queue order
}

struct RoomInfo {
    string roomName;
    User[] userList;
    Video video;
    Video[][string] playlist;
}

final class Room {
    private long roomID;
    private Task roomLoop;
    private Timer videoLoop;

    private LocalManualEvent pingEvent;
    public shared size_t latestMessage = 0;
    private Message[64] messageQueue;

    private UserList roomUsers;

    private Video currentVideo;
    private VideoPlaylist playlist = new VideoPlaylist();

    this(long ID) {
        this.roomID = ID;
        this.roomUsers = new UserList(ID);
        pingEvent = createManualEvent();
        roomLoop = runTask({
            writeln("Creating New Room: ", ID);
        });
        videoLoop = createTimer({
            videoSyncLoop();
        });
    }

    private @trusted nothrow void postMessage(MessageType type, string msg = "", UUID[] targetUsers = [], string key = "data") {
        try {
            Json j = Json.emptyObject;
            j["type"] = type;
            if (msg.length > 0 && key.length > 0) j[key] = msg;
            latestMessage = (latestMessage + 1) % messageQueue.length;
            messageQueue[latestMessage] = Message(j.toString(), targetUsers);
            pingEvent.emit();
        } catch (Exception e) {
            logException(e, "Failed to send Websocket Message");
        }
    }

    private @trusted nothrow void postJson(MessageType type, Json msg, UUID[] targetUsers = [], string key = "data") {
        try {
            Json j = Json.emptyObject;
            j["type"] = type;
            j[key] = msg;
            latestMessage = (latestMessage + 1) % messageQueue.length;
            messageQueue[latestMessage] = Message(j.toString(), targetUsers);
            pingEvent.emit();
        } catch (Exception e) {
            logException(e, "Failed to send Websocket Json");
        }
    }
    private @trusted nothrow void postSerializedJson(T)(MessageType type, T obj) {
        try {
            postJson(type, serializeToJson(obj));
        } catch (Exception e) {
            logException(e, "Failed to serialize Object for " ~ type);
        }
    }

    private Json getRoomJson() {
        return serializeToJson(RoomInfo("Room " ~ roomID.to!string, roomUsers.getUserList(), currentVideo, playlist.getPlaylist()));
    }

    private @trusted void postUserList() {
        postSerializedJson!(User[])(MessageType.UserList, roomUsers.getUserList());
    }
    private @trusted nothrow void postPlaylist() {
        postSerializedJson!(Video[][string])(MessageType.QueueOrder, playlist.getPlaylist());
        postSerializedJson!(string[])(MessageType.UserOrder, playlist.getUserQueue());
    }

    private @trusted nothrow void queueNextVideo() {
        if (playlist.hasNextVideo()) {
            currentVideo = playlist.getNextVideo();
            currentVideo.playing = true;
            // TODO: move to async method to wait for clients to declare ready
            try {
                writeln("Room ", roomID, " Now Playing ", currentVideo.title);
                postJson(MessageType.Video, serializeToJson(currentVideo), [], "Video");
            } catch (Exception e) {
                logException(e, "Failed to Serialize Websocket Json");
            }
            if (videoLoop.pending) {
                videoLoop.stop();
            }
            videoLoop.rearm(1.seconds, true);
        }
        postPlaylist();
    }

    private void roomLoopOperation() {
        while(roomUsers.userCount > 0) {
            if (roomUsers.updateUserStatus())
                postUserList();
            sleep(10.seconds);
        }
    }

    @safe
    private nothrow void videoSyncLoop() {
        if (roomUsers.userCount <= 0 && currentVideo.playing == false)  {
            videoLoop.stop();
            currentVideo = Video.init;
            return;
        }
        if (currentVideo.playing) {
            if (currentVideo.timeStamp <= (currentVideo.duration + currentVideo.trim)) { 
                postMessage(MessageType.Sync, currentVideo.timeStamp.to!string);
            } else {
                postMessage(MessageType.Pause);
                currentVideo.playing = false;
                queueNextVideo();
            }
            currentVideo.timeStamp++;
        }
    }

    // TODO: check stability behind REST endpoint instead of websocket
    //  Otherwise move to client-side and send all the video information to queue
    //  Client side may work better in the future for YT playlists anyway
    private void queueVideo(string videoID, UUID userID) {
        getVideoInformation(videoID, (info) {
            if (playlist.addVideoToQueue(userID, info)) {
                postPlaylist();
                if (!currentVideo.playing) queueNextVideo();
            } else {
                writeln("Skipping duplicate queue of ", info.title);
                postMessage(MessageType.Error, "Video already in Queue", [userID], "error");
            }
        }, (error) {
            postMessage(MessageType.Error, "Failed to Queue Video: Network Error", [userID], "error");
        });
    }

    public Json addUser(UUID clientID) {
        if (!roomLoop.running) {
            roomLoop = runTask({
                roomLoopOperation();
            });
        }
        if (!currentVideo.playing)
            queueVideo("C0DPdy98e4c", randomUUID());
        UUID id = roomUsers.addUser(clientID);
        Json j = Json.emptyObject;
        j["type"] = MessageType.Init;
        j["ID"] = id.toString();
        j["Room"] = getRoomJson();
        postUserList();
        return j;
    }
    public void removeUser(UUID id) {
        if (roomUsers.removeUser(id)) {
            playlist.removeUser(id);
            postUserList();
            writeln("User Left: ", id.toString());
        } else {
            writeln("Failed to Remove User: ", id.toString());
        }
        if (roomUsers.userCount == 0) {
            roomLoop.join();
        }
    }

    public bool activeUser(UUID id) {
        return roomUsers.activeUser(id);
    }

    public size_t waitForMessage(size_t lastMessage) {
        while (lastMessage == latestMessage)
            pingEvent.wait();
        return latestMessage;
    }
    public Message[] retrieveLatestMessages(size_t last, size_t latest) {
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

    public void receivedMessage(UUID id, string message) {
        Json j = parseJson(message);
        switch (j["type"].get!string) {
            case MessageType.Ping:
                roomUsers.setUserActive(id);
                break;
            case MessageType.Play:
                currentVideo.playing = true;
                postMessage(MessageType.Play);
                break;
            case MessageType.Pause:
                currentVideo.playing = false;
                postMessage(MessageType.Pause);
                break;
            case MessageType.QueueAdd:
                const vid = j["data"].get!string;
                queueVideo(vid, id);
                break;
            default:
                writeln("Invalid Message Type", message);
        }
    }
}

private Room[long] roomList;

Room getOrCreateRoom(long roomID) {
    if (roomID in roomList) return roomList[roomID];
    return roomList[roomID] = new Room(roomID);
}