/* eslint-disable prettier/prettier */
import { videoIDFromURL, parseDurationString, parsePlaylistItemJSON } from "../../utils/YoutubeTypes";

const mockPlaylistItem = {
    "kind": "youtube#playlistItem",
    "etag": undefined,
    "id": "htYR2GdA7OE",
    "snippet": {
      "publishedAt": "2020-08-22T14:48:23.918Z",
      "channelId": "UC9ecwl3FTG66jIKA9JRDtmg",
      "title": "SampleTitle",
      "description": "SampleDescription",
      "thumbnails": {
        default: {
          "url": "https://i.ytimg.com/vi/htYR2GdA7OE/default.jpg",
          "width": 120,
          "height": 120
        }
      },
      "channelTitle": "Silvagunner",
      "playlistId": "PLL0CQjrcN8D2Ohe31VaCW4d-Xo40PkUA3",
      "position": 0,
      "resourceId": {
        "kind": "video",
        "videoId": "htYR2GdA7OE",
      }
    },
    "contentDetails": {
      "videoId": "htYR2GdA7OE",
      "startAt": undefined,
      "endAt": undefined,
      "note": "",
      "videoPublishedAt": "2020-08-22T14:48:23.918Z"
    },
    "status": {
      "privacyStatus": ""
    }
  }

describe("Youtube Types", () => {
    it("Parses URLS", () => {
        const expected: { [key: string]: string } = {
            "https://youtu.be/6cwisxAlHUU": "6cwisxAlHUU",
            "https://www.youtube.com/watch?v=6cwisxAlHUU&list=LLiEPjqLpcqpMK-VDQq2Ae7A&index=4&t=0s": "6cwisxAlHUU",
            "https://youtu.be/gOiTXSri3FE?list=LLiEPjqLpcqpMK-VDQq2Ae7A&t=1": "gOiTXSri3FE",
            "https://www.youtube.com/watch?v=htYR2GdA7OE&t=14072s": "htYR2GdA7OE",
            "https://www.youtube.com/watch?time_continue=28&v=J4Jfnz-m0Vg&feature=emb_logo": "J4Jfnz-m0Vg",
            "https://www.youtube.com/watch?v=_MF-BfpZhd8&t=0s": "_MF-BfpZhd8"
        };

        Object.keys(expected).forEach(url => {
            expect(videoIDFromURL(url)).toEqual(expected[url]);
        });
    });

    it("Parses Durations", () => {
        const expected: { [key: string]: number } = {
            PT15M33S: 933,
            PT1M12S: 72,
            PT1H6M: 3960
        };

        Object.keys(expected).forEach(url => {
            expect(parseDurationString(url)).toEqual(expected[url]);
        });
    });

    it("Parses Playlist Items", () => {
        const video = parsePlaylistItemJSON(mockPlaylistItem);
        expect(video.channel).toEqual("Silvagunner");
        expect(video.duration).toBeUndefined();
        expect(video.id).toEqual("htYR2GdA7OE");
        expect(video.title).toEqual("SampleTitle");
        expect(video.thumbnailMaxRes.height).toEqual(120);
    });
});
