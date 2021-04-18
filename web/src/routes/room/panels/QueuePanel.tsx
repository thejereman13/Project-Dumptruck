import { h, JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useDebouncedCallback } from "use-debounce-preact";
import { VideoInfo, PlaylistInfo, videoIDFromURL, playlistIDFromURL } from "../../../utils/YoutubeTypes";
import {
    RequestAllPlaylists,
    RequestVideo,
    RequestLikedVideos,
    RequestPlaylist,
    useGAPIContext
} from "../../../utils/GAPI";
import Input from "preact-mui/lib/input";
import { VideoDisplayCard, VideoCardInfo } from "../../../components/displayCards/VideoCard";
import { LikedVideosCard, PlaylistCard } from "../../../components/displayCards/PlaylistCard";
import { YoutubeVideoInformation } from "../../../utils/BackendTypes";
import { useAbortController } from "../../../utils/AbortController";
import { memo } from "preact/compat";

import * as style from "./QueuePanel.css";
import * as commonStyle from "../style.css";

export interface QueueModalProps {
    submitNewVideo: (newVideo: YoutubeVideoInformation, videoTitle: string) => void;
    submitAllVideos: (newVideos: YoutubeVideoInformation[], playlistTitle: string) => void;
}

export const QueueModal = memo(function QueueModal(props: QueueModalProps): JSX.Element {
    const { submitNewVideo, submitAllVideos } = props;
    const [searchField, setSearchField] = useState<string>("");
    const [searchResults, setSearchResults] = useState<VideoInfo[]>([]);
    const [searchPlaylist, setSearchPlaylist] = useState<PlaylistInfo | null>(null);
    const [userPlaylists, setUserPlaylists] = useState<PlaylistInfo[]>([]);
    const [likedPreview, setLikedPreview] = useState<VideoInfo | null>(null);
    const [playlistSearch, setPlaylistSearch] = useState<string>("");

    const controller = useAbortController();
    const currentAPI = useGAPIContext();

    const [debouncedSearch] = useDebouncedCallback(
        (search: string) => {
            if (currentAPI?.isAPILoaded() && search.length > 0) {
                const id = videoIDFromURL(search);
                const pid = playlistIDFromURL(search);
                if (id)
                    RequestVideo(id, controller, (vid) => {
                        if (!controller.current.signal.aborted) {
                            setSearchResults([vid]);
                            setSearchPlaylist(null);
                        }
                    });
                else if (pid)
                    RequestPlaylist(pid, controller, (play) => {
                        if (!controller.current.signal.aborted) {
                            setSearchPlaylist(play);
                            setSearchResults([]);
                        }
                    });
                else {
                    setPlaylistSearch(search);
                }
            } else {
                setSearchResults([]);
                setPlaylistSearch("");
            }
        },
        200,
        [currentAPI]
    );

    useEffect(() => {
        if (currentAPI?.isAPILoaded()) {
            RequestAllPlaylists(controller, (list) => {
                if (list) setUserPlaylists(list);
            });
            RequestLikedVideos(
                controller,
                (vids) => {
                    if (vids && vids.length > 0) setLikedPreview(vids[0]);
                },
                true
            );
        }
    }, [currentAPI, controller]);

    const updateVideoSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const val = e.currentTarget.value;
        setSearchField(val);
        debouncedSearch(val);
    };

    const submitVideoFromList = (videoID: VideoCardInfo | VideoInfo): void => {
        if (videoID.duration === undefined)
            RequestVideo(videoID.id, controller, (info) => {
                submitNewVideo(
                    {
                        videoID: info.id,
                        duration: info.duration ?? 0
                    },
                    videoID.title
                );
            });
        else
            submitNewVideo(
                {
                    videoID: videoID.id,
                    duration: videoID.duration ?? 0
                },
                videoID.title
            );
    };
    const submitPlaylist = (vids: VideoCardInfo[], info: PlaylistInfo): void => {
        submitAllVideos(
            vids.map((v) => ({
                videoID: v.id,
                duration: v.duration ?? 0
            })),
            info.title
        );
    };

    const filteredPlaylists =
        playlistSearch.length > 0
            ? userPlaylists.filter((p) => p.title.toUpperCase().includes(playlistSearch.toUpperCase()))
            : userPlaylists;

    return (
        <div class={style.queueContainer}>
            <div class={style.queueTabBody}>
                <div class={style.searchDiv}>
                    <Input floatingLabel label="Search" value={searchField} onChange={updateVideoSearch} />
                </div>
                <div class={commonStyle.scrollBox}>
                    {searchPlaylist && (
                        <PlaylistCard
                            info={searchPlaylist}
                            onVideoClick={submitVideoFromList}
                            submitPlaylist={submitPlaylist}
                        />
                    )}
                    {searchResults.map((list) => {
                        return (
                            <VideoDisplayCard
                                key={list.id}
                                enablePreview={true}
                                info={{ ...list, thumbnailURL: list.thumbnailMaxRes?.url ?? "" }}
                                onClick={(): void => {
                                    submitVideoFromList(list);
                                }}
                            />
                        );
                    })}
                    {likedPreview !== null && filteredPlaylists === userPlaylists && (
                        <LikedVideosCard
                            info={{
                                id: "",
                                channel: "",
                                description: "",
                                title: "Liked Videos",
                                videoCount: 0,
                                thumbnailMaxRes: likedPreview.thumbnailMaxRes
                            }}
                            onVideoClick={submitVideoFromList}
                            submitPlaylist={submitPlaylist}
                        />
                    )}
                    {filteredPlaylists.map((list) => {
                        return (
                            <PlaylistCard
                                key={list.id}
                                info={list}
                                onVideoClick={submitVideoFromList}
                                submitPlaylist={submitPlaylist}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
});
