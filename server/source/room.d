module room;

import vibe.core.core;
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
import message;
import sockets;
import DB = database;

import std.stdio;

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
    private bool skipErrors;
    private bool waitUsers;

    private Task roomLoop;
    private Timer videoLoop;
    private Timer clearUser;

    private UUID[] usersPendingRemoval;
    private bool roomLoopRunning = false;
    public bool constructed = false;

    private UserList roomUsers;
    public MessageQueue messageQueue;

    private Video currentVideo;
    private VideoPlaylist playlist;

    this(long ID, UUID creatingUser) {
        this.constructed = true;
        this.roomID = ID;
        this.roomUsers = new UserList(ID);
        this.messageQueue = new MessageQueue();
        this.playlist = new VideoPlaylist();
        runTask({
            logInfo("Spooling Up Room: " ~ ID.to!string);
            auto dbInfo = DB.getRoomInformation(ID, creatingUser);
            if (dbInfo.roomID > 0) {
                readInRoomSettings(dbInfo.settings);
                this.roomUsers.adminUsers = dbInfo.admins;
                this.messageQueue.postJson(MessageType.Room, getRoomJson(), [], "Room");
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
        this.roomID = 0;
    }

    private void readInRoomSettings(const DB.DBRoomSettings settings) {
        this.roomName = settings.name;
        this.videoTrim = settings.trim;
        this.guestControls = settings.guestControls;
        this.hifiTiming = settings.hifiTiming;
        this.skipErrors = settings.skipErrors;
        this.waitUsers = settings.waitUsers;
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
        messageQueue.postSerializedJson!(User[])(MessageType.UserList, roomUsers.getUserList());
    }
    private @trusted nothrow void postPlaylist() {
        messageQueue.postSerializedJson!(Video[][string])(MessageType.QueueOrder, playlist.getPlaylist());
        messageQueue.postSerializedJson!(string[])(MessageType.UserOrder, playlist.getUserQueue());
    }

    /* Room Loops */
    private Timer roomDeletionDelay;

    private void roomLoopOperation() {
        if (!constructed) return;
        roomLoopRunning = true;
        while(roomUsers.userCount > 0) {
            auto removed = roomUsers.updateUserStatus();
            foreach(id; removed) {
                playlist.removeUser(id);
            }
            if (removed.length > 0)
                postUserList();

            messageQueue.pingEvent();
            sleep(10.seconds);
        }
        roomLoopRunning = false;
        roomDeletionDelay = setTimer(30.seconds,
        {
            if (constructed && (!roomLoopRunning || roomUsers.userCount == 0)) {
                messageQueue.stop();
                videoLoop.stop();
                roomDeletionDelay.stop();
                deleteRoom(roomID);
            }
        });
    }

    @safe
    private nothrow void videoSyncLoop() {
        if (!constructed) return;
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
                // Post every 4 seconds unless in hifi mode and userCount is less than 32
                if (counter == 0 || (hifiTiming && roomUsers.userCount < 32))
                    messageQueue.postMessage(MessageType.Sync, currentVideo.timeStamp.to!string);
            } else {
                messageQueue.postMessage(MessageType.Pause);
                currentVideo.playing = false;
                queueNextVideo();
            }
            currentVideo.timeStamp++;
            counter = (counter + 1) & 0x3; // counter up to 3 (modulo 4)
        }
    }
    @safe
    private nothrow void removeUsersFromQueue() {
        if (!constructed) return;
        foreach (id; usersPendingRemoval) {
            if (!roomUsers.activeUser(id)) {
                playlist.removeUser(id);
            }
        }
        usersPendingRemoval = [];
    }

    /* Video Queue */

    private @trusted nothrow void queueNextVideo() {
        if (playlist.hasNextVideo()) {
            currentVideo = playlist.getNextVideo();
            // if not waiting on users, start playing the video immediately
            currentVideo.playing = !this.waitUsers;
            try {
                messageQueue.postJson(MessageType.Video, serializeToJson(currentVideo), [], "Video");
            } catch (Exception e) {
                logException(e, "Failed to Serialize CurrentVideo for Websocket");
            }
            roomUsers.clearTempUserLists();
            if (videoLoop.pending) {
                videoLoop.stop();
            }
            if (!this.waitUsers) {
                videoLoop.rearm(1.seconds, true);
            }
        } else {
            currentVideo = Video.init;
            try {
                messageQueue.postJson(MessageType.Video, serializeToJson(currentVideo), [], "Video");
            } catch (Exception e) {
                logException(e, "Failed to Serialize CurrentVideo for Websocket");
            }
            if (videoLoop.pending) {
                videoLoop.stop();
            }
        }
        postPlaylist();
    }

    private void queueVideo(Json videoInfo, UUID userID) {
        auto newVideo = validateVideoInfo(videoInfo);
        if (newVideo.videoID.length > 0) {
            if (playlist.addVideoToQueue(userID, newVideo)) {
                postPlaylist();
                if (currentVideo.youtubeID.length == 0) queueNextVideo();
            } else {
                messageQueue.postMessage(MessageType.Error, "Video already in Queue", [userID], "error");
            }
        } else {
            logWarn("Failed to validate Video");
        }
    }
    private void unqueueVideo(Json videoID, UUID userID) {
        if (playlist.removeVideoFromQueue(videoID.get!string, userID)) {
            postPlaylist();
        } else {
            messageQueue.postMessage(MessageType.Error, "Insufficient Permissions", [userID], "error");
        }
    }
    private void queueAllVideo(Json videosInfo, UUID userID) {
        YoutubeVideoInformation[] arr = videosInfo.get!(Json[]).map!validateVideoInfo.array;
        auto successCounter = 0;
        auto failureCounter = 0;
        foreach (YoutubeVideoInformation newVid; arr) {
            if (newVid.videoID.length > 0) {
                if (playlist.addVideoToQueue(userID, newVid)) {
                    successCounter++;
                    if (currentVideo.youtubeID.length == 0) queueNextVideo();
                } else {
                    failureCounter++;
                }
            } else {
                logWarn("Failed to validate Video");
            }
        }
        if (failureCounter > 1) {
            messageQueue.postMessage(MessageType.Error, "Some Videos Already in Queue: Skipping", [userID], "error");
        } else if (failureCounter == 1) {
            messageQueue.postMessage(MessageType.Error, "Video Already in Queue: Skipping", [userID], "error");
        }
        if (successCounter) postPlaylist();
    }
    private void clearQueue(Json message, UUID id) {
        const UUID target = UUID(message["data"].get!string);
        if (target.empty) return;
        if (authorizedUser(id) || target == id) {
            playlist.removeUser(id);
            postPlaylist();
        }
    }
    private void updateQueue(Json videos, UUID userID, Json target) {
        const UUID targetID = UUID(target.get!string);
        const YoutubeVideoInformation[] arr = videos.get!(Json[]).map!validateVideoInfo.array;
        if ((authorizedUser(userID) || userID == targetID) && playlist.replaceVideosInQueue(targetID, arr)) {
            postPlaylist();
        } else {
            messageQueue.postMessage(MessageType.Error, "Could Not Reorder User Queue", [userID], "error");
        }
    }

    /* Room Users */

    public Json addUser(UUID clientID) {
        if (!constructed) return Json.emptyObject;
        UUID id = roomUsers.addUser(clientID);
        if (!roomLoopRunning) {
            roomLoop = runTask({
                roomLoopOperation();
            });
        }

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
        if (!constructed) return;
        if (roomUsers.removeUser(id)) {
            postUserList();
            // When a user leaves, wait at least 8 seconds before removing their videos from queue
            // Multiple back-to-back leaves may continuously bump this callback further and further back,
            // but that shouldn't be a huge issue. Doing independent timers would likely cause more problems
            // than it's worth.
            usersPendingRemoval ~= id;
            if (clearUser.pending) {
                clearUser.stop();
            }
            clearUser.rearm(8.seconds, false);
        }
        if (roomUsers.userCount == 0 && roomLoopRunning) {
            roomLoop.join();
            currentVideo = Video.init;
        }
    }
    public bool activeUser(UUID id) {
        if (!constructed) return false;
        return roomUsers.activeUser(id);
    }

    private bool authorizedUser(UUID id) {
        return roomUsers.adminUsers.any!(u => u == id);
    }

    private void addAdmin(Json userID) {
        UUID target = UUID(userID.get!string);
        roomUsers.addAdmin(target);
        messageQueue.postJson(MessageType.Room, getRoomJson(), [], "Room");
    }
    private void removeAdmin(Json userID, UUID id) {
        const UUID target = UUID(userID.get!string);
        if (target != id && this.roomUsers.adminUsers.length > 1) {
            roomUsers.removeAdmin(target);
            messageQueue.postJson(MessageType.Room, getRoomJson(), [], "Room");
        } else {
            messageQueue.postMessage(MessageType.Error, "Can not Remove Admin", [id], "error");
        }
    }

    private void logUserError(UUID id) {
        // skip the current video if more than half of the users have encountered an error
        if (skipErrors && roomUsers.setUserErrored(id) >= 0.5) {
            queueNextVideo();
        }
    }
    private void logUserReady(UUID id) {
        // queue the next video once 90% of active users have loaded it
        if (waitUsers && roomUsers.setUserReady(id) >= 0.9) {
            currentVideo.playing = true;
            messageQueue.postMessage(MessageType.Play);
            videoLoop.rearm(1.seconds, true);
        }
    }


    private void setRoomSettings(Json settings) {
        const newSettings = DB.setRoomSettings(roomID, settings);
        if (newSettings.name.length > 0) {
            readInRoomSettings(newSettings);
            messageQueue.postJson(MessageType.Room, getRoomJson(), [], "Room");
        }
    }

    public void receivedMessage(UUID id, string message) {
        if (!constructed || id.empty) return;
        Json j = parseJson(message);
        switch (j["type"].get!string) {
            case MessageType.Ping:
                roomUsers.setUserActive(id);
                break;
            case MessageType.Play:
                if (guestControls || authorizedUser(id)) {
                    currentVideo.playing = true;
                    messageQueue.postMessage(MessageType.Play);
                    messageQueue.postMessage(MessageType.Sync, currentVideo.timeStamp.to!string);
                }
                break;
            case MessageType.Pause:
                if (guestControls || authorizedUser(id)) {
                    currentVideo.playing = false;
                    messageQueue.postMessage(MessageType.Pause);
                }
                break;
            case MessageType.QueueAdd:
                queueVideo(j["data"], id);
                break;
            case MessageType.QueueRemove:
                unqueueVideo(j["data"], id);
                break;
            case MessageType.QueueMultiple:
                queueAllVideo(j["data"], id);
                break;
            case MessageType.QueueClear:
                clearQueue(j, id);
                break;
            case MessageType.QueueReorder:
                updateQueue(j["data"], id, j["target"]);
                break;
            case MessageType.AdminAdd:
                if (authorizedUser(id))
                    addAdmin(j["data"]);
                break;
            case MessageType.AdminRemove:
                if (authorizedUser(id))
                    removeAdmin(j["data"], id);
                break;
            case MessageType.UserError:
                logUserError(id);
                break;
            case MessageType.UserReady:
                logUserReady(id);
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
    logInfo("Deallocating Room " ~ roomID.to!string);
    destroy(roomList[roomID]);
    roomList.remove(roomID);
}