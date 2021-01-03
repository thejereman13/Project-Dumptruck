import { h, JSX } from "preact";
import { useEffect, useState, Ref } from "preact/hooks";
import { useDebouncedCallback } from "use-debounce-preact";
import { VideoInfo, PlaylistInfo, videoIDFromURL, playlistIDFromURL } from "../../utils/YoutubeTypes";
import {
    SearchVideo,
    RequestAllPlaylists,
    GAPIInfo,
    RequestVideo,
    RequestLikedVideos,
    RequestPlaylist
} from "../../utils/GAPI";
import Button from "preact-mui/lib/button";
import Input from "preact-mui/lib/input";
import * as style from "./style.css";
import { Tabs, Tab } from "../../components/Tabs";
import { VideoDisplayCard, PlaylistCard, VideoCardInfo, LikedVideosCard } from "../../components/VideoCard";
import { YoutubeVideoInformation } from "../../utils/BackendTypes";
import { useAbortController } from "../../components/AbortController";
import { memo } from "preact/compat";
import { getQueueCookie, setQueueCookie } from "../../utils/Cookies";

export interface QueueModalProps {
    currentAPI: GAPIInfo | null;
    submitNewVideo: (newVideo: YoutubeVideoInformation, videoTitle: string) => void;
    submitAllVideos: (newVideos: YoutubeVideoInformation[], playlistTitle: string) => void;
    onClose: () => void;
    parentController: Ref<AbortController>;
}

export const QueueModal = memo(
    function QueueModal(props: QueueModalProps): JSX.Element {
        const { currentAPI, submitNewVideo, submitAllVideos, parentController, onClose } = props;
        const [searchField, setSearchField] = useState("");
        const [queueTab, setQueueTab] = useState(getQueueCookie());
        const [searchResults, setSearchResults] = useState<VideoInfo[]>([]);
        const [searchPlaylist, setSearchPlaylist] = useState<PlaylistInfo | null>(null);
        const [userPlaylists, setUserPlaylists] = useState<PlaylistInfo[]>([]);
        const [likedPreview, setLikedPreview] = useState<VideoInfo | null>(null);

        const controller = useAbortController();

        const [debouncedSearch] = useDebouncedCallback(
            (search: string) => {
                if (currentAPI?.isAPILoaded() && search.length > 0) {
                    const id = videoIDFromURL(search);
                    const pid = playlistIDFromURL(search);
                    if (id)
                        RequestVideo(id, controller, vid => {
                            if (!controller.current.signal.aborted) {
                                setSearchResults([vid]);
                                setSearchPlaylist(null);
                            }
                        });
                    else if (pid)
                        RequestPlaylist(pid, controller, play => {
                            if (!controller.current.signal.aborted) {
                                setSearchPlaylist(play);
                                setSearchResults([]);
                            }
                        });
                    // Search requests are too expensive to be doing automatically
                    // else
                    //     SearchVideo(search, controller, results => {
                    //         if (!controller.current.signal.aborted) {
                    //             setSearchResults(results);
                    //             setSearchPlaylist(null);
                    //         }
                    //     });
                } else {
                    setSearchResults([]);
                }
            },
            200,
            [currentAPI]
        );

        const searchVideos = (): void => {
            if (searchField.trim().length > 0)
                SearchVideo(searchField.trim(), controller, results => {
                    if (!controller.current.signal.aborted) {
                        setSearchResults(results);
                        setSearchPlaylist(null);
                    }
                });
        };

        const trySearchVideos = (e: React.KeyboardEvent<HTMLInputElement>): void => {
            if (e.key === "Enter") searchVideos();
        };

        useEffect(() => {
            if (currentAPI?.isAPILoaded()) {
                RequestAllPlaylists(controller, list => {
                    if (list) setUserPlaylists(list);
                });
                RequestLikedVideos(
                    controller,
                    vids => {
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
                RequestVideo(videoID.id, parentController, info => {
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
                vids.map(v => ({
                    videoID: v.id,
                    duration: v.duration ?? 0
                })),
                info.title
            );
        };

        const updateTab = (tab: number): void => {
            setQueueTab(tab);
            setQueueCookie(tab);
        };

        return (
            <div class={style.ModalBox} onClick={(e): void => e.stopPropagation()}>
                <div>
                    <Tabs tabNames={["Search", "Playlists"]} index={queueTab} onIndex={updateTab} />
                </div>
                <div class={style.sidePanelTabBody}>
                    <Tab index={0} tabIndex={queueTab}>
                        <div class={style.searchPanel}>
                            <div class={style.searchDiv}>
                                <Input
                                    floatingLabel
                                    label="Search For a Video"
                                    value={searchField}
                                    onChange={updateVideoSearch}
                                    onKeyDown={trySearchVideos}
                                />
                                <Button onClick={searchVideos}>Search</Button>
                            </div>
                            <div class={style.scrollBox}>
                                {searchPlaylist && (
                                    <PlaylistCard
                                        info={searchPlaylist}
                                        onVideoClick={submitVideoFromList}
                                        onPlaylistClick={submitPlaylist}
                                        parentController={parentController}
                                    />
                                )}
                                {searchResults.map(list => {
                                    return (
                                        <VideoDisplayCard
                                            key={list.id}
                                            info={{ ...list, thumbnailURL: list.thumbnailMaxRes?.url ?? "" }}
                                            onClick={(): void => {
                                                submitVideoFromList(list);
                                                onClose();
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </Tab>
                    <Tab index={1} tabIndex={queueTab}>
                        <div class={style.scrollBox}>
                            {likedPreview !== null && (
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
                                    onPlaylistClick={submitPlaylist}
                                    parentController={parentController}
                                />
                            )}
                            {userPlaylists.map(list => {
                                return (
                                    <PlaylistCard
                                        key={list.id}
                                        info={list}
                                        onVideoClick={submitVideoFromList}
                                        onPlaylistClick={submitPlaylist}
                                        parentController={parentController}
                                    />
                                );
                            })}
                        </div>
                    </Tab>
                </div>
            </div>
        );
    },
    (prev: QueueModalProps, next: QueueModalProps) => {
        const same =
            prev.currentAPI === next.currentAPI &&
            prev.onClose === next.onClose &&
            prev.parentController === next.parentController &&
            prev.submitAllVideos === next.submitAllVideos &&
            prev.submitNewVideo === next.submitNewVideo;
        return same;
    }
);
