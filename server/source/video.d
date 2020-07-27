module video;

import vibe.http.client;
import std.conv;
import std.regex;
import std.array;

import std.stdio;

struct YoutubeVideoInformation {
    string title;
    string channel;
    int duration;
}

const APIKey = "AIzaSyDXi-XaQWWjDR2yH8MoM31IZ3inE4OvrpM";

void getVideoInformation(string videoID, void delegate(YoutubeVideoInformation) callback) {
    const string url = "https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&key=" ~ APIKey ~ "&id=" ~ videoID;

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