module video;

import vibe.http.client;
import vibe.core.core;
import vibe.core.log;
import std.conv;
import std.regex;
import std.array;

import std.stdio;
import configuration;

struct YoutubeVideoInformation {
    string title;
    string channel;
    int duration;
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
            //  TODO: investigate failed HTTP attempts
            //  Likely due to incorrect video IDs
            requestHTTP(url,
                (scope req) {
                    req.method = HTTPMethod.GET;
                },
                (scope res) {
                    const js = res.readJson();
                    if (js["items"].length > 0) {
                        auto ret = YoutubeVideoInformation("", "");
                        const snip = js["items"][0]["snippet"];
                        const cont = js["items"][0]["contentDetails"];
                        ret.title = snip["localized"]["title"].get!string;
                        ret.channel = snip["channelTitle"].get!string;
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
        writeln(info);
    }, (error) {
        writeln(error);
    });
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