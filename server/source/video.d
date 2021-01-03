module video;

import vibe.http.client;
import vibe.core.core;
import vibe.core.log;
import std.conv;
import std.regex;
import std.uuid;
import std.array;
import std.exception;
import std.algorithm;

import std.stdio;
import configuration;

/**
Youtube Video Information
*/
struct Video {
    string youtubeID;
    bool playing;
    int timeStamp;
    int duration;
    UUID queuedBy;
}

struct YoutubeVideoInformation {
    string videoID;
    int duration;
}

final class VideoPlaylist {

    private Video[][UUID] playlist; // playlist per user
    private UUID[] userQueue; //array of user UUIDs
    private size_t lastUser = 0; //index of the last userQueue element queued

    public @trusted nothrow Video[][string] getPlaylist() {
        Video[][string] retPlaylist;
        foreach(id; playlist.byKey()) {
            retPlaylist[id.toString()] = playlist[id];
        }
        return retPlaylist;
    }
    public @trusted nothrow string[] getUserQueue() {
        if (userQueue.length == 0) return [];

        size_t nextIndex = (lastUser + 1) % userQueue.length;
        return (userQueue[nextIndex .. $] ~ userQueue[0 .. lastUser])
            .filter!(u => u in playlist).map!(u => u.toString()).array;
    }

    public @trusted nothrow bool hasNextVideo() {
        return peekNextVideo() != size_t.max;
    }

    private @trusted nothrow size_t peekNextVideo() {
        if (playlist.length > 0 && userQueue.length > 0) {
            size_t nextIndex = (lastUser + 1) % userQueue.length;
            // loop all the way through the list until reaching the starting point
            while (nextIndex != lastUser) {
                if (userQueue[nextIndex] in playlist) {
                    break;
                } else {
                    nextIndex = (nextIndex + 1) % userQueue.length;
                }
            }
            if (userQueue[nextIndex] in playlist && playlist[userQueue[nextIndex]].length > 0) {
                return nextIndex;
            }
        }
        return size_t.max;
    }

    public @trusted nothrow Video getNextVideo() {
        const size_t nextIndex = peekNextVideo();
        if (nextIndex != size_t.max) {
            Video next = playlist[userQueue[nextIndex]][0];
            if (playlist[userQueue[nextIndex]].length > 1) {
                // slice off the top of the user's playlist
                playlist[userQueue[nextIndex]] = playlist[userQueue[nextIndex]][1..$];
            } else {
                //  If the user's playlist is empty, clear it out
                playlist.remove(userQueue[nextIndex]);
            }
            // update the last user to this one
            lastUser = nextIndex;
            return next;
        }
        return Video.init;
    }

    public @trusted nothrow bool addVideoToQueue(UUID userID, YoutubeVideoInformation videoInfo) {
        if (!playlist.keys.any!((u) => playlist[u].any!((a) => a.youtubeID == videoInfo.videoID))) {
            if (!(userID in playlist)) playlist[userID] = [];
            playlist[userID] ~= Video(
                videoInfo.videoID,
                false, 0,
                videoInfo.duration,
                userID);
            if (!userQueue.any!((u) => u == userID)) {
                userQueue ~= userID;
            }
            return true;
        }
        return false;
    }

    public @trusted nothrow bool replaceVideosInQueue(UUID userID, const YoutubeVideoInformation[] videoInfos) {
        if (userID !in playlist) return false;
        playlist[userID] = videoInfos.map!(vi => Video(vi.videoID, false, 0, vi.duration, userID)).array;
        return true;
    }

    public @trusted nothrow bool removeVideoFromQueue(string videoID, UUID userID) {
        if (userID in playlist) {
            const index = playlist[userID].countUntil!((v) => v.youtubeID == videoID);
            if (index >= 0) {
                playlist[userID] = playlist[userID].remove(index);
                return true;
            }
        }
        return false;
    }

    public @trusted nothrow bool removeUser(UUID userID) {
        const index = userQueue.countUntil(userID);
        if (index >= 0) {
            playlist.remove(userQueue[index]);
            userQueue = userQueue.remove(index);
            return true;
        }
        return false;
    }
}

void getVideoInformation(string videoID, void delegate(YoutubeVideoInformation) callback, void delegate(Exception) errorCallback) {
    if (videoID.length < 11) {
        errorCallback(new Exception("Invalid ID"));
        return;
    }
    const string url = "https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&key="
        ~ server_configuration["youtube_api_key"].get!string ~ "&id=" ~ videoID;
    runTask({
        try {
            requestHTTP(url,
                (scope req) {
                    req.method = HTTPMethod.GET;
                },
                (scope res) {
                    const js = res.readJson();
                    if (js["items"].length > 0) {
                        auto ret = YoutubeVideoInformation.init;
                        const snip = js["items"][0]["snippet"];
                        const cont = js["items"][0]["contentDetails"];
                        ret.videoID = videoID;
                        ret.duration = secondsFromDuration(cont["duration"].get!string);
                        callback(ret);
                    }
            });
        } catch (Exception e) {
            logException(e, "Failed to Request Youtube API");
            errorCallback(e);
        }
    });
}

import vibe.vibe;
void videoInfoRequest(HTTPServerRequest req, HTTPServerResponse res) {
    string id = req.params["id"].to!string;

    getVideoInformation(id, (info) {
        res.writeJsonBody(serializeToJson(info), 201, false);
    }, (error) {
        res.writeJsonBody("{}", 400, false);
        writeln(error);
    });
}

YoutubeVideoInformation validateVideoInfo(Json info) {
    auto ret = YoutubeVideoInformation.init;
    try {
        ret.videoID = info["videoID"].get!string;
        // ret.duration = secondsFromDuration(info["duration"].get!string);
        ret.duration = info["duration"].get!int;
        if (ret.duration > 0 && ret.videoID.length > 0)
            return ret;
    } catch (Exception e) {
        logException(e, "Failed to Parse Video Info");
    }
    return YoutubeVideoInformation.init;
} 



const reg = regex(r"^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$");

int secondsFromDuration(string isoDuration) {
    auto matches = array(matchFirst(isoDuration, reg));
    if (matches.length < 9) return 0;
    const int hours = matches[6].length > 0 ? matches[6].to!int : 0;
    const int minutes = matches[7].length > 0 ? matches[7].to!int : 0;
    const int seconds = matches[8].length > 0 ? matches[8].to!int : 0;
    return hours * 3600 + minutes * 60 + seconds;
}