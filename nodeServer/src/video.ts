/**
Youtube Video Information
*/
export interface Video {
    youtubeID: string;
    playing: boolean;
    timeStamp: number;
    duration: number;
    queuedBy: string;
}

export interface YoutubeVideoInformation {
    videoID: string;
    duration: number;
}

export class VideoPlaylist {

    private playlist: Record<string, Video[]> = {}; // playlist per user
    private userQueue: string[] = []; //array of user UUIDs
    private lastUser = 0; //index of the last userQueue element queued

    public getPlaylist(): Record<string, Video[]> {
        const retPlaylist: Record<string, Video[]> = {};
        // TODO: maybe a shallow copy is fine
        Object.keys(this.playlist).forEach((id) => {
            retPlaylist[id] = [...this.playlist[id]];
        });
        return retPlaylist;
    }
    public getUserQueue(): string[] {
        if (this.userQueue.length === 0) return [];

        const nextIndex = (this.lastUser + 1) % this.userQueue.length;
        const tempQueue = [...this.userQueue];
        // bringToFront(tempQueue[0 .. nextIndex], tempQueue[nextIndex .. $]);
        // TODO: double check this logic
        tempQueue.concat(tempQueue.splice(0, nextIndex));
        return tempQueue.filter((u) => u in this.playlist);
    }

    public hasNextVideo(): boolean {
        return this.peekNextVideo() != Number.MAX_SAFE_INTEGER;
    }

    private peekNextVideo(): number {
        if (Object.keys(this.playlist).length > 0 && this.userQueue.length > 0) {
            let nextIndex = (this.lastUser + 1) % this.userQueue.length;
            // loop all the way through the list until reaching the starting point
            while (nextIndex != this.lastUser) {
                if (this.userQueue[nextIndex] in this.playlist) {
                    break;
                } else {
                    nextIndex = (nextIndex + 1) % this.userQueue.length;
                }
            }
            if (this.userQueue[nextIndex] in this.playlist && this.playlist[this.userQueue[nextIndex]].length > 0) {
                return nextIndex;
            }
        }
        return Number.MAX_SAFE_INTEGER;
    }

    public getNextVideo(): Video {
        const nextIndex = this.peekNextVideo();
        if (nextIndex != Number.MAX_SAFE_INTEGER) {
            const next = this.playlist[this.userQueue[nextIndex]][0];
            if (this.playlist[this.userQueue[nextIndex]].length > 1) {
                // slice off the top of the user's playlist
                this.playlist[this.userQueue[nextIndex]].splice(0, 1);
            } else {
                //  If the user's playlist is empty, clear it out
                delete this.playlist[this.userQueue[nextIndex]];
            }
            // update the last user to this one
            this.lastUser = nextIndex;
            return next;
        }
        return {
            duration: 0,
            playing: false,
            queuedBy: "",
            timeStamp: 0,
            youtubeID: ""
        };
    }

    public addVideoToQueue(userID: string, videoInfo: YoutubeVideoInformation): boolean {
        if (!Object.keys(this.playlist).some((u) => this.playlist[u].some((a) => a.youtubeID === videoInfo.videoID))) {
            if (!(userID in this.playlist)) this.playlist[userID] = [];
            this.playlist[userID].push({
                youtubeID: videoInfo.videoID,
                playing: false,
                timeStamp: 0,
                duration: videoInfo.duration,
                queuedBy: userID
            });
            if (!this.userQueue.some((u) => u === userID)) {
                this.userQueue.push(userID);
            }
            return true;
        }
        return false;
    }

    public replaceVideosInQueue(userID: string, videoInfos: YoutubeVideoInformation[]): boolean {
        if (!(userID in this.playlist)) return false;
        this.playlist[userID] = videoInfos.map(vi => ({ youtubeID: vi.videoID, playing: false, timeStamp: 0, duration: vi.duration, queuedBy: userID }));
        return true;
    }

    public removeVideoFromQueue(videoID: string, userID: string): boolean {
        if (userID in this.playlist) {
            const index = this.playlist[userID].findIndex((v) => v.youtubeID === videoID);
            if (index >= 0) {
                this.playlist[userID].splice(index, 1);
                return true;
            }
        }
        return false;
    }

    public removeUser(userID: string): boolean {
        const index = this.userQueue.indexOf(userID);
        if (index >= 0) {
            delete this.playlist[this.userQueue[index]];
            this.userQueue.splice(index, 1);
            return true;
        }
        return false;
    }
}

export function validateVideoInfo(info: Record<string, any>): YoutubeVideoInformation {
    // TODO: probably not completely valid
    const ret: YoutubeVideoInformation = {
        videoID: "",
        duration: 0,
    };
    try {
        ret.videoID = info["videoID"];
        // ret.duration = secondsFromDuration(info["duration"].get!string);
        ret.duration = info["duration"];
        if (ret.duration > 0 && ret.videoID.length > 0)
            return ret;
    } catch (e) {
        console.error(e, "Failed to Parse Video Info");
    }
    return ret;
} 

const reg = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

export function secondsFromDuration(isoDuration: string): number {
    const matches = reg.exec(isoDuration);
    if (!matches || matches.length < 9) return 0;
    const hours = matches[6].length > 0 ? Number(matches[6]) : 0;
    const minutes = matches[7].length > 0 ? Number(matches[7]) : 0;
    const seconds = matches[8].length > 0 ? Number(matches[8]) : 0;
    return hours * 3600 + minutes * 60 + seconds;
}