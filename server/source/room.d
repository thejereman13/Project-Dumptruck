module room;

import vibe.core.core;
import vibe.core.sync;
import vibe.core.log;
import vibe.data.json;
import core.time;
import std.uuid;
import std.algorithm;
import std.conv;

import video;

import std.stdio;

enum MessageType {
    Sync = "sync",
    Ping = "ping",
    UserJoin = "userJoined",
    UserLeft = "userLeft",
    Play = "play",
    Pause = "pause",
    Video = "video",
    Init = "init",
    QueueAdd = "addQueue",
    QueueRemove = "removeQueue",
    QueueReorder = "reorderQueue"
}

struct User {
    UUID id;
    string name;
}

struct Video {
    string youtubeID;
    string title;
    string channelName;
    bool playing;
    int timeStamp;
    int duration;
}

struct RoomInfo {
    string roomName;
    User[] userList;
    Video video;
}

final class Room {

    private long roomID;
    private int userCount = 0;
    private Task roomLoop;
    private Timer videoLoop;

    private LocalManualEvent pingEvent;
    private shared size_t latestMessage = 0;
    private string[64] messageQueue;

    private shared bool[UUID] roomUserStatus;
    private User[UUID] roomUsers;

    private Video currentVideo;

    this(long ID) {
        this.roomID = ID;
        pingEvent = createManualEvent();
        roomLoop = runTask({
            writeln("Creating New Room: ", ID);
        });
        videoLoop = createTimer({
            videoSyncLoop();
        });
    }

    private @trusted nothrow void postMessage(MessageType type, string msg = "", string key = "data") {
        try {
            Json j = Json.emptyObject;
            j["type"] = type;
            if (msg.length > 0 && key.length > 0) j[key] = msg;
            latestMessage = (latestMessage + 1) % messageQueue.length;
            messageQueue[latestMessage] = j.toString();
            pingEvent.emit();
        } catch (Exception e) {
            logException(e, "Failed to send Websocket Message");
        }
    }

    private @trusted nothrow void postJson(MessageType type, Json msg, string key = "data") {
        try {
            Json j = Json.emptyObject;
            j["type"] = type;
            j[key] = msg;
            latestMessage = (latestMessage + 1) % messageQueue.length;
            messageQueue[latestMessage] = j.toString();
            pingEvent.emit();
        } catch (Exception e) {
            logException(e, "Failed to send Websocket Json");
        }
    }

    private void roomLoopOperation() {
        while(userCount > 0) {
            // postMessage(MessageType.Ping);
            foreach (User u; roomUsers) {
                if (u.id in roomUserStatus) {
                    if (!roomUserStatus[u.id]) {
                        writeln("Lost User ", u.id);
                        removeUser(u.id);
                    }
                    roomUserStatus[u.id] = false;
                }
            }
            sleep(10.seconds);
        }
    }

    @safe
    private nothrow void videoSyncLoop() {
        if (userCount <= 0)  {
            videoLoop.stop();
            return;
        }
        if (currentVideo.playing) {
            if (currentVideo.timeStamp <= currentVideo.duration) { 
                postMessage(MessageType.Sync, currentVideo.timeStamp.to!string);
            } else {
                postMessage(MessageType.Pause);
                currentVideo.playing = false;
                // TODO: post new video if queued in playlist
            }
            currentVideo.timeStamp++;
        }
    }

    void startVideo(string videoID) {
        getVideoInformation(videoID, (info) {
            currentVideo = Video(videoID, info.title, info.channel, true, 0, info.duration);
            postJson(MessageType.Video, serializeToJson(currentVideo), "Video");
            if (videoLoop.pending) {
                videoLoop.stop();
            }
            videoLoop.rearm(1.seconds, true);
        });
    }

    Json addUser() {
        userCount++;
        if (!roomLoop.running) {
            roomLoop = runTask({
                roomLoopOperation();
            });
        }
        postMessage(MessageType.UserJoin);
        if (!currentVideo.playing)
            startVideo("6cwisxAlHUU");
        const id = randomUUID();
        roomUsers[id] = User(id, "User-" ~ id.toString());
        roomUserStatus[id] = true;
        Json j = Json.emptyObject;
        j["type"] = MessageType.Init;
        j["ID"] = roomUsers[id].id.toString();
        j["Room"] = serializeToJson(RoomInfo("Room " ~ roomID.to!string, roomUsers.values, currentVideo));
        return j;
    }
    void removeUser(UUID id) {
        userCount--;
        if (userCount == 0) {
            roomLoop.join();
        }
        if (roomUsers.remove(id) && roomUserStatus.remove(id)) {
            postMessage(MessageType.UserLeft);
            writeln("User Left: ", id.toString());
            writeln(roomUsers);
        } else {
            writeln("Failed to Remove User: ", id.toString());
        }
    }

    bool activeUser(UUID id) {
        return id in roomUsers && id in roomUserStatus;
    }

    string waitForMessage() {
        pingEvent.wait();
        return messageQueue[latestMessage];
    }

    void receivedMessage(UUID id, string message) {
        Json j = parseJson(message);
        switch (j["type"].get!string) {
            case MessageType.Ping:
                roomUserStatus[id] = true;
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
                startVideo(vid);
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