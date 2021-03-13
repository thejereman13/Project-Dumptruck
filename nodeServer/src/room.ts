import { DBRoomSettings, peekRoomInformation, setRoomAdmins, setRoomSettings } from "./database";
import { User, UserList } from "./user";
import { MessageQueue, MessageType } from "./message";
import { validateVideoInfo, Video, VideoPlaylist } from "./video";
import { sleep } from "./utils";

import NanoTimer from "nanotimer";

export interface RoomInfo {
    roomName: string;
    userList: User[];
    adminList: string[];
    video: Video | null;
    playlist: Record<string, Video[]>;
    userQueue: string[];
    guestControls: boolean;
}

class Room {
    private roomID: number;
    public settings: DBRoomSettings = {} as DBRoomSettings;

    private videoLoop = new NanoTimer();
    private clearUser = new NanoTimer();

    private usersPendingRemoval: string[] = [];
    public roomLoopRunning = false;
    public constructed;
    public initialized = false;

    private roomUsers: UserList;
    public messageQueue: MessageQueue;

    private currentVideo: Video | null = null;
    private playlist: VideoPlaylist;

    public constructor(ID: number) {
        this.constructed = true;
        this.roomID = ID;
        this.roomUsers = new UserList(ID);
        this.playlist = new VideoPlaylist();
        this.messageQueue = new MessageQueue();
    }

    public async init() {
        const dbInfo = await peekRoomInformation(this.roomID);
        if (dbInfo) {
            if (dbInfo.roomID > 0) {
                this.settings = dbInfo.settings;
                this.roomUsers = new UserList(dbInfo.roomID);
                this.roomUsers.adminUsers = dbInfo.admins;
                // eslint-disable-next-line
                // @ts-ignore
                this.messageQueue.postMessage(MessageType.Room, this.getRoomInfo(), [], "Room");
            }
        } else {
            this.constructed = false;
        }
        console.info("Spooling Up Room: " + this.roomID);
        // Initialized indicates that the DB has been parsed and/or loaded
        // If initialized is true and constructed is false, then there was an error loading
        // and the room should be discarded.
        this.initialized = true;
    }

    public destroy() {
        this.clearUser.clearTimeout();
        this.videoLoop.clearInterval();
        this.messageQueue.destroy();
        this.roomID = 0;
    }

    private getRoomInfo(): RoomInfo {
        return {
            roomName: this.settings.name,
            userList: this.roomUsers.getUserList(),
            adminList: this.roomUsers.adminUsers,
            video: this.currentVideo,
            playlist: this.playlist.getPlaylist(),
            userQueue: this.playlist.getUserQueue(),
            guestControls: this.settings.guestControls
        };
    }

    private postUserList() {
        this.messageQueue.postMessage(MessageType.UserList, this.roomUsers.getUserList());
    }
    private postPlaylist() {
        this.messageQueue.postMessage(MessageType.QueueOrder, this.playlist.getPlaylist());
        this.messageQueue.postMessage(MessageType.UserOrder, this.playlist.getUserQueue());
    }

    /* Room Loops */
    private roomDeletionDelay: NodeJS.Timeout | null = null;

    private async roomLoopOperation() {
        if (!this.constructed) return;
        this.roomLoopRunning = true;
        while (this.roomUsers.userCount > 0) {
            const removed = this.roomUsers.updateUserStatus();
            removed.forEach((id) => {
                this.playlist.removeUser(id);
            });
            if (removed.length > 0)
                this.postUserList();

            await sleep(10000);
        }
        this.roomLoopRunning = false;
        this.roomDeletionDelay = setTimeout(
            () => {
                if (this.constructed && (!this.roomLoopRunning || this.roomUsers.userCount == 0)) {
                    this.videoLoop.clearInterval();
                    this.videoLoopActive = false;
                    if (this.roomDeletionDelay) clearTimeout(this.roomDeletionDelay);
                    deleteRoom(this.roomID);
                }
            }, 30000);
    }


    private counter = 0;
    private videoLoopActive = false;
    private videoSyncLoop() {
        if (!this.constructed) return;
        if (this.roomUsers.userCount <= 0 && this.usersPendingRemoval.length <= 0 && !this.currentVideo?.playing) {
            this.videoLoop.clearInterval();
            this.videoLoopActive = false;
            this.currentVideo = null;
            this.counter = 0;
            return;
        }
        this.videoLoopActive = true;
        if (this.currentVideo?.playing) {
            if (this.currentVideo.timeStamp < 6) // Ensure syncing at the beginning of the video
                this.counter = 0;
            if (this.currentVideo.timeStamp <= (this.currentVideo.duration + this.settings.trim)) {
                this.currentVideo.timeStamp++;
                // Post every 4 seconds unless in hifi mode and userCount is less than 32
                if (this.counter == 0 || (this.settings.hifiTiming && this.roomUsers.userCount < 32))
                    this.messageQueue.postMessage(MessageType.Sync, this.currentVideo.timeStamp);
            } else {
                this.messageQueue.postMessage(MessageType.Pause);
                this.currentVideo.playing = false;
                this.queueNextVideo();
            }
            this.counter = (this.counter + 1) & 0x3; // counter up to 3 (modulo 4)
        }
    }
    private removeUsersFromQueue() {
        if (!this.constructed) return;
        this.usersPendingRemoval.forEach((id) => {
            if (!this.roomUsers.activeUser(id)) {
                this.playlist.removeUser(id);
            }
        });
        this.usersPendingRemoval = [];
    }

    /* Video Queue */

    private queueNextVideo() {
        this.currentVideo = this.playlist.getNextVideo();
        if (this.currentVideo) {
            // if not waiting on users, start playing the video immediately
            this.currentVideo.playing = !this.settings.waitUsers;
            this.messageQueue.postMessage(MessageType.Video, this.currentVideo, [], "Video");
            this.roomUsers.clearTempUserLists();
            if (!this.settings.waitUsers) {
                if (!this.videoLoopActive) {
                    this.videoLoop.setInterval(() => this.videoSyncLoop(), "", "1s");
                    this.videoSyncLoop();
                }
            } else {
                this.videoLoopActive = false;
                this.videoLoop.clearInterval();
                this.videoLoop.clearTimeout();
            }
        } else {
            this.messageQueue.postMessage(MessageType.Video, this.currentVideo, [], "Video");
            this.videoLoopActive = false;
            this.videoLoop.clearInterval();
            this.videoLoop.clearTimeout();
        }
        this.postPlaylist();
    }

    private queueVideo(videoInfo: Record<string, any>, userID: string) {
        const newVideo = validateVideoInfo(videoInfo);
        if (newVideo.videoID.length > 0) {
            if (this.playlist.addVideoToQueue(userID, newVideo)) {
                this.postPlaylist();
                if (!this.currentVideo) this.queueNextVideo();
            } else {
                this.messageQueue.postMessage(MessageType.Error, "Video already in Queue", [userID], "error");
            }
        } else {
            console.warn("Failed to validate Video");
        }
    }
    private unqueueVideo(videoID: string, userID: string) {
        if (this.playlist.removeVideoFromQueue(videoID, userID)) {
            this.postPlaylist();
        } else {
            this.messageQueue.postMessage(MessageType.Error, "Insufficient Permissions", [userID], "error");
        }
    }
    private queueAllVideo(videosInfo: Record<string, any>[], userID: string) {
        const arr = videosInfo.map(validateVideoInfo);
        let successCounter = 0;
        let failureCounter = 0;
        arr.forEach((newVid) => {
            if (newVid.videoID.length > 0) {
                if (this.playlist.addVideoToQueue(userID, newVid)) {
                    successCounter++;
                    if (!this.currentVideo) this.queueNextVideo();
                } else {
                    failureCounter++;
                }
            } else {
                console.warn("Failed to validate Video");
            }
        });
        if (failureCounter > 1) {
            this.messageQueue.postMessage(MessageType.Error, "Some Videos Already in Queue: Skipping", [userID], "error");
        } else if (failureCounter == 1) {
            this.messageQueue.postMessage(MessageType.Error, "Video Already in Queue: Skipping", [userID], "error");
        }
        if (successCounter) this.postPlaylist();
    }
    private clearQueue(message: { data: string }, id: string) {
        if (!message.data) return;
        if (this.authorizedUser(id) || message.data === id) {
            this.playlist.removeUser(id);
            this.postPlaylist();
        }
    }
    private updateQueue(videos: Record<string, any>[], userID: string, targetID: string) {
        const arr = videos.map(validateVideoInfo);
        if ((this.authorizedUser(userID) || userID == targetID) && this.playlist.replaceVideosInQueue(targetID, arr)) {
            this.postPlaylist();
        } else {
            this.messageQueue.postMessage(MessageType.Error, "Could Not Reorder User Queue", [userID], "error");
        }
    }

    /* Room Users */

    public async addUser(clientID: string): Promise<{ t: MessageType, ID: string, Room: RoomInfo } | null> {
        if (!this.constructed) return null;
        const id = await this.roomUsers.addUser(clientID);
        // Start running the room if it's not yet up
        if (!this.roomLoopRunning) {
            this.roomLoopOperation();
        }

        // If the room no longer has admins, assign admin access to the first person to log in
        // This prevents stale rooms from being left empty
        if (this.roomUsers.adminUsers.length == 0 && clientID) {
            this.roomUsers.adminUsers = [clientID];
            await setRoomAdmins(this.roomID, this.roomUsers.adminUsers);
        }
        this.postUserList();
        return {
            t: MessageType.Init,
            ID: id,
            Room: this.getRoomInfo(),
        };
    }
    public removeUser(id: string) {
        if (!this.constructed) return;
        if (this.roomUsers.removeUser(id)) {
            this.postUserList();
            // When a user leaves, wait at least 8 seconds before removing their videos from queue
            // Multiple back-to-back leaves may continuously bump this callback further and further back,
            // but that shouldn't be a huge issue. Doing independent timers would likely cause more problems
            // than it's worth.
            // TODO: users refreshing may cause multiple occurances in pendingRemoval
            // this doesn't actually cause problems with playlists or user count though
            this.usersPendingRemoval.push(id);
            this.clearUser.clearTimeout();
            this.clearUser.setTimeout(() => this.removeUsersFromQueue(), "", "8s");
        }
    }
    public activeUser(id: string): boolean {
        if (!this.constructed) return false;
        return this.roomUsers.activeUser(id);
    }

    private authorizedUser(id: string): boolean {
        return this.roomUsers.adminUsers.includes(id);
    }

    private addAdmin(target: string) {
        this.roomUsers.addAdmin(target);
        setRoomAdmins(this.roomID, this.roomUsers.adminUsers);
        this.messageQueue.postMessage(MessageType.Room, this.getRoomInfo(), [], "Room");
    }
    private removeAdmin(target: string, id: string) {
        if (target !== id && this.roomUsers.adminUsers.length > 1) {
            this.roomUsers.removeAdmin(target);
            setRoomAdmins(this.roomID, this.roomUsers.adminUsers);
            this.messageQueue.postMessage(MessageType.Room, this.getRoomInfo(), [], "Room");
        } else {
            this.messageQueue.postMessage(MessageType.Error, "Can not Remove Admin", [id], "error");
        }
    }

    private logUserError(id: string) {
        // skip the current video if more than half of the users have encountered an error
        if (this.settings.skipErrors && this.roomUsers.setUserErrored(id) >= 0.5) {
            this.queueNextVideo();
        }
    }
    private logUserReady(id: string) {
        // queue the next video once 90% of active users have loaded it
        if (this.currentVideo && this.settings.waitUsers && this.roomUsers.setUserReady(id) >= 0.9) {
            this.currentVideo.playing = true;
            this.messageQueue.postMessage(MessageType.Play);
            this.videoLoopActive = true;
            this.videoLoop.setInterval(() => this.videoSyncLoop(), "", "1s");
            this.videoSyncLoop();
        }
    }


    private async setRoomSettings(settings: Record<string, any>) {
        const newSettings = await setRoomSettings(this.roomID, settings);
        if (newSettings.name.length > 0) {
            this.settings = newSettings;
            this.messageQueue.postMessage(MessageType.Room, this.getRoomInfo(), [], "Room");
        }
    }

    public receivedMessage(id: string, message: string) {
        if (!this.constructed || !id) return;
        const j = JSON.parse(message);
        switch (j["t"]) {
            case MessageType.Ping:
                this.roomUsers.setUserActive(id);
                break;
            case MessageType.Play:
                if ((this.settings.guestControls || this.authorizedUser(id)) && this.currentVideo) {
                    this.currentVideo.playing = true;
                    this.messageQueue.postMessage(MessageType.Play);
                    this.messageQueue.postMessage(MessageType.Sync, this.currentVideo.timeStamp);
                }
                break;
            case MessageType.Pause:
                if ((this.settings.guestControls || this.authorizedUser(id)) && this.currentVideo) {
                    this.currentVideo.playing = false;
                    this.messageQueue.postMessage(MessageType.Pause);
                }
                break;
            case MessageType.QueueAdd:
                this.queueVideo(j["d"], id);
                break;
            case MessageType.QueueRemove:
                this.unqueueVideo(j["d"], id);
                break;
            case MessageType.QueueMultiple:
                this.queueAllVideo(j["d"], id);
                break;
            case MessageType.QueueClear:
                this.clearQueue(j, id);
                break;
            case MessageType.QueueReorder:
                this.updateQueue(j["d"], id, j["target"]);
                break;
            case MessageType.AdminAdd:
                if (this.authorizedUser(id))
                    this.addAdmin(j["d"]);
                break;
            case MessageType.AdminRemove:
                if (this.authorizedUser(id))
                    this.removeAdmin(j["d"], id);
                break;
            case MessageType.UserError:
                this.logUserError(id);
                break;
            case MessageType.UserReady:
                this.logUserReady(id);
                break;
            case MessageType.Skip:
                if (this.settings.guestControls || this.authorizedUser(id)) {
                    this.queueNextVideo();
                }
                break;
            case MessageType.RoomSettings:
                if (this.authorizedUser(id))
                    this.setRoomSettings(j["d"]);
                break;
            default:
                console.warn("Invalid Message Type %s", message);
                break;
        }
    }

    public getPlaying(): Video | null {
        return this.currentVideo;
    }
    public getUserCount(): number {
        return this.roomUsers.getUserList().length;
    }
}

const roomList: Record<number, Room> = {};

export async function getOrCreateRoom(roomID: number): Promise<Room> {
    if (roomID in roomList) return roomList[roomID];
    const r = new Room(roomID);
    await r.init();
    roomList[roomID] = r;
    return r;
}

export function getRoom(roomID: number): Room | null {
    if (Number.isNaN(roomID)) return null;
    if (roomID in roomList) return roomList[roomID];
    return null;
}

export function getActiveRooms(): number[] {
    const rooms = Object.keys(roomList) as unknown as number[];
    return rooms.filter((k) => roomList[k].roomLoopRunning && roomList[k].settings.publicVisibility);
}

export function deleteRoom(roomID: number): void {
    if (!(roomID in roomList)) return;
    console.info("Deallocating Room " + roomID);
    roomList[roomID].destroy();
    delete roomList[roomID];
}

const maxRoom = 1 << 20; // 1048576
export function getNextRoomID(): number {
    return Math.round(Math.random() * maxRoom);
}