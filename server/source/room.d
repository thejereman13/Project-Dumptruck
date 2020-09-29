module room;

import vibe.core.core;
import vibe.core.sync;
import vibe.core.log;
import vibe.data.json;
import vibe.http.websockets;
import core.time;
import std.uuid;
import std.algorithm;
import std.conv;
import std.array;
import std.exception;

import video;
import user;
import sockets;
import DB = database;

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
    Skip = "skip", // Client requesting the next video
    Video = "video", // Server setting the active Client video
    Init = "init", // Server sending all initialization info
    Room = "room", // Server sending all room information
    QueueAdd = "addQueue", // Client adding a video id to queue
    QueueMultiple = "allQueue", // Client adding multiple videos
    QueueRemove = "removeQueue", // Client removing a video id from queue
    QueueOrder = "orderQueue", // Server updating the client playlist
    UserOrder = "userQueue", // Server updating the room user queue order
    RoomSettings = "settings", // Admin updating the room settings
    AdminAdd = "addAdmin", // Admin adding another admin
    AdminRemove = "removeAdmin" // Admin removing another admin
}

struct RoomInfo {
    string roomName;
    User[] userList;
    UUID[] adminList;
    Video video;
    Video[][string] playlist;
    string[] userQueue;
    bool guestControls;
}

final class Room {
    private long roomID;
    private string roomName;
    private int videoTrim;
    private bool guestControls;
    private bool hifiTiming;

    private Task roomLoop;
    private Timer videoLoop;
    private Timer clearUser;

    private UUID[] usersPendingRemoval;

    private LocalManualEvent pingEvent;
    public shared size_t latestMessage = 0;
    private Message[64] messageQueue;

    private UserList roomUsers;

    private Video currentVideo;
    private VideoPlaylist playlist = new VideoPlaylist();

    this(long ID, UUID creatingUser) {
        this.roomID = ID;
        this.roomUsers = new UserList(ID);
        pingEvent = createManualEvent();
        roomLoop = runTask({
            writeln("Spooling Up Room: ", ID);
            auto dbInfo = DB.getRoomInformation(ID, creatingUser);
            if (dbInfo.roomID > 0) {
                readInRoomSettings(dbInfo.settings);
                this.roomUsers.adminUsers = dbInfo.admins;
                postJson(MessageType.Room, getRoomJson(), [], "Room");
            }
        });
        videoLoop = createTimer({
            videoSyncLoop();
        });
        clearUser = createTimer({
            removeUsersFromQueue();
        });
    }

    ~this() {
        clearUser.stop();
        videoLoop.stop();
    }

    private void readInRoomSettings(const DB.DBRoomSettings settings) {
        this.roomName = settings.name;
        this.videoTrim = settings.trim;
        this.guestControls = settings.guestControls;
        this.hifiTiming = settings.hifiTiming;
    }

    /* Posting Messages to clients */

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
        return serializeToJson(RoomInfo(
            roomName,
            roomUsers.getUserList(),
            roomUsers.adminUsers,
            currentVideo,
            playlist.getPlaylist(),
            playlist.getUserQueue(),
            guestControls
        ));
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
            try {
                writeln("Room ", roomName, " Now Playing ", currentVideo.youtubeID);
                postJson(MessageType.Video, serializeToJson(currentVideo), [], "Video");
            } catch (Exception e) {
                logException(e, "Failed to Serialize CurrentVideo for Websocket");
            }
            if (videoLoop.pending) {
                videoLoop.stop();
            }
            videoLoop.rearm(1.seconds, true);
        } else {
            currentVideo = Video.init;
            try {
                postJson(MessageType.Video, serializeToJson(currentVideo), [], "Video");
            } catch (Exception e) {
                logException(e, "Failed to Serialize CurrentVideo for Websocket");
            }
        }
        postPlaylist();
    }

    public size_t waitForMessage(WebSocket socket, size_t lastMessage) {
        int emitCount = 0;
        while (socket.connected && lastMessage == latestMessage) {
            emitCount = pingEvent.wait(emitCount + 1);
        }
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

    /* Room Loops */

    private void roomLoopOperation() {
        while(roomUsers.userCount > 0) {
            auto removed = roomUsers.updateUserStatus();
            foreach(id; removed) {
                playlist.removeUser(id);
            }
            if (removed.length > 0)
                postUserList();
            pingEvent.emit();
            sleep(10.seconds);
        }
        setTimer(60.seconds,
        {
            if (roomUsers.userCount == 0)
                deleteRoom(roomID);
        });
    }

    @safe
    private nothrow void videoSyncLoop() {
        static int counter = 0;
        if (roomUsers.userCount <= 0 && usersPendingRemoval.length <= 0 && currentVideo.playing == false)  {
            videoLoop.stop();
            currentVideo = Video.init;
            counter = 0;
            return;
        }
        if (currentVideo.playing) {
            if (currentVideo.timeStamp < 4) // Ensure syncing at the beginning of the video
                counter = 0;
            if (currentVideo.timeStamp <= (currentVideo.duration + videoTrim)) {
                // Post every 4 seconds unless in hifi mode and userCount is less than 50
                if (counter == 0 || (hifiTiming && roomUsers.userCount < 50))
                    postMessage(MessageType.Sync, currentVideo.timeStamp.to!string);
            } else {
                postMessage(MessageType.Pause);
                currentVideo.playing = false;
                queueNextVideo();
            }
            currentVideo.timeStamp++;
            counter = (counter + 1) & 0x3; // counter up to 3 (modulo 4)
        }
    }
    @safe
    private nothrow void removeUsersFromQueue() {
        foreach (id; usersPendingRemoval) {
            if (!roomUsers.activeUser(id)) {
                playlist.removeUser(id);
            }
        }
        usersPendingRemoval = [];
    }

    /* Video Queue */

    private void queueVideo(Json videoInfo, UUID userID) {
        auto newVideo = validateVideoInfo(videoInfo);
        if (newVideo.videoID.length > 0) {
            if (playlist.addVideoToQueue(userID, newVideo)) {
                postPlaylist();
                if (currentVideo.youtubeID.length == 0) queueNextVideo();
            } else {
                postMessage(MessageType.Error, "Video already in Queue", [userID], "error");
            }
        } else {
            logWarn("Failed to validate Video");
        }
    }
    private void unqueueVideo(Json videoID, UUID userID) {
        if (playlist.removeVideoFromQueue(videoID.get!string, userID)) {
            postPlaylist();
        } else {
            postMessage(MessageType.Error, "Insufficient Permissions", [userID], "error");
        }
    }
    private void queueAllVideo(Json videosInfo, UUID userID) {
        YoutubeVideoInformation[] arr = videosInfo.get!(Json[]).map!validateVideoInfo.array;
        auto successCounter = 0;
        foreach (YoutubeVideoInformation newVid; arr) {
            if (newVid.videoID.length > 0) {
                if (playlist.addVideoToQueue(userID, newVid)) {
                    successCounter++;
                    if (currentVideo.youtubeID.length == 0) queueNextVideo();
                } else {
                    postMessage(MessageType.Error, "Video already in Queue", [userID], "error");
                }
            } else {
                logWarn("Failed to validate Video");
            }
        }
        if (successCounter) postPlaylist();
    }

    /* Room Users */

    public Json addUser(UUID clientID) {
        if (!roomLoop.running) {
            roomLoop = runTask({
                roomLoopOperation();
            });
        }
        UUID id = roomUsers.addUser(clientID);

        // If the room was created by a guest user (before they finished logging in)
        // assign admin access to the first person to join the room (probably the person still logging in)
        if (roomUsers.adminUsers.length == 0 && !clientID.empty) {
            DB.setRoomAdmins(roomID, [clientID]);
            roomUsers.adminUsers = [clientID];
        }

        Json j = Json.emptyObject;
        j["type"] = MessageType.Init;
        j["ID"] = id.toString();
        j["Room"] = getRoomJson();
        postUserList();
        return j;
    }
    public void removeUser(UUID id) {
        if (roomUsers.removeUser(id)) {
            postUserList();
            // When a user leaves, wait at least 5 seconds before removing their videos from queue
            // Multiple back-to-back leaves may continuously bump this callback further and further back,
            // but that shouldn't be a huge issue. Doing independent timers would likely cause more problems
            // than it's worth.
            usersPendingRemoval ~= id;
            if (clearUser.pending) {
                clearUser.stop();
            }
            clearUser.rearm(5.seconds, false);
        }
        if (roomUsers.userCount == 0) {
            roomLoop.join();
            currentVideo = Video.init;
        }
    }
    public bool activeUser(UUID id) {
        return roomUsers.activeUser(id);
    }

    private bool authorizedUser(UUID id) {
        return roomUsers.adminUsers.any!(u => u == id);
    }

    private void addAdmin(Json userID, UUID id) {
        UUID target = UUID(userID.get!string);
        this.roomUsers.addAdmin(target);
        postJson(MessageType.Room, getRoomJson(), [], "Room");
    }
    private void removeAdmin(Json userID, UUID id) {
        UUID target = UUID(userID.get!string);
        if (target != id) {
            this.roomUsers.removeAdmin(target);
            postJson(MessageType.Room, getRoomJson(), [], "Room");
        }
    }


    private void setRoomSettings(Json settings) {
        const newSettings = DB.setRoomSettings(roomID, settings);
        if (newSettings.name.length > 0) {
            readInRoomSettings(newSettings);
            postJson(MessageType.Room, getRoomJson(), [], "Room");
        }
    }

    public void receivedMessage(UUID id, string message) {
        Json j = parseJson(message);
        switch (j["type"].get!string) {
            case MessageType.Ping:
                roomUsers.setUserActive(id);
                break;
            case MessageType.Play:
                if (guestControls || authorizedUser(id)) {
                    currentVideo.playing = true;
                    postMessage(MessageType.Play);
                    if (currentVideo.playing)
                        postMessage(MessageType.Sync, currentVideo.timeStamp.to!string);
                }
                break;
            case MessageType.Pause:
                if (guestControls || authorizedUser(id)) {
                    currentVideo.playing = false;
                    postMessage(MessageType.Pause);
                    if (currentVideo.playing)
                        postMessage(MessageType.Sync, currentVideo.timeStamp.to!string);
                }
                break;
            case MessageType.QueueAdd:
                if (!id.empty)
                    queueVideo(j["data"], id);
                break;
            case MessageType.QueueRemove:
                unqueueVideo(j["data"], id);
                break;
            case MessageType.AdminAdd:
                if (authorizedUser(id))
                    addAdmin(j["data"], id);
                break;
            case MessageType.AdminRemove:
                if (authorizedUser(id))
                    removeAdmin(j["data"], id);
                break;
            case MessageType.QueueMultiple:
                queueAllVideo(j["data"], id);
                break;
            case MessageType.Skip:
                if (guestControls || authorizedUser(id)) {
                    queueNextVideo();
                }
                break;
            case MessageType.RoomSettings:
                if (authorizedUser(id))
                    setRoomSettings(j["data"]);
                break;
            default:
                logWarn("Invalid Message Type %s", message);
                break;
        }
    }
}

private Room[long] roomList;

Room getOrCreateRoom(long roomID, UUID user) {
    if (roomID in roomList) return roomList[roomID];
    return roomList[roomID] = new Room(roomID, user);
}

void deleteRoom(long roomID) {
    if (!roomID in roomList) return;
    writeln("Deleting Room ", roomID);
    destroy(roomList[roomID]);
    roomList.remove(roomID);
}