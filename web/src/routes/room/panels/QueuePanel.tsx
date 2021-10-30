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

import { style as commonStyle } from "./panelStyle";
import { VideoQueueMenu } from "../../../components/displayCards/QueueMenu";
import MdClear from "@meronex/icons/md/MdClear";
import MdSort from '@meronex/icons/md/MdSort';
import { css } from "@linaria/core";
import { Dropdown } from "../../../components/Dropdown";
import Button from "preact-mui/lib/button";
import { getSortCookie, setSortCookie } from "../../../utils/Cookies";
import { LRUList } from "../../../utils/Caching";

const style = {
    queueContainer: css`
        padding-top: 0.5rem;
        padding-right: 0.5rem;
        display: flex;
        overflow: hidden;
        width: 100%;
    `,
    queueTabBody: css`
        display: flex;
        flex-flow: column;
        overflow-y: hidden;
        width: 100%;
    `,
    searchDiv: css`
        width: 100%;
        padding: 0 1rem;
        display: flex;
        align-items: center;
        flex-direction: row;
        position: relative;
        & > div {
            flex: auto;
        }
    `,
    inputDiv: css`
        display: flex;
        position: relative;
        align-items: center;
        & > div {
            flex: auto;
        }
    `,
    searchClear: css`
        position: absolute;
        right: 0;
        background: transparent;
        border: none;
        cursor: pointer;
        border-radius: 50%;
        color: var(--theme-primary);
        padding: 0.25rem;
        display: flex;
        &:hover {
            background: var(--dp16-surface);
        }
    `,
    sortDropdown: css`
        flex: none !important;
        margin-left: 1rem;
        & > button {
            color: var(--theme-primary);
        }
    `,
};

const recentPlaylists = new LRUList<string>("playlistLRU");

const sortOptions = [
    {
        display: "Create Date (Dec)",
    },
    {
        display: "Create Date (Asc)",
    },
    {
        display: "Recently Queued",
    },
    {
        display: "A - Z (Dec)",
    },
    {
        display: "A - Z (Asc)",
    }
];

function sortPlaylist(list: PlaylistInfo[], sortType: number): PlaylistInfo[] {
    switch (sortType) {
        case 0:
            return list;
        case 1:
            return [...list].reverse();
        case 2:
            const recent = recentPlaylists.getList().map((id) => list.find((p) => p.id === id)).filter((p) => p !== undefined) as PlaylistInfo[];
            return [...recent, ...list.filter((p) => !recent.includes(p))];
        case 3:
            return [...list].sort((p, q) => p.title.toLocaleUpperCase() > q.title.toLocaleUpperCase() ? 1 : -1);
        case 4:
            return [...list].sort((p, q) => p.title.toLocaleUpperCase() > q.title.toLocaleUpperCase() ? -1 : 1);
        default:
            return list;
    }
}

export interface QueueModalProps {
    submitNewVideoEnd: (newVideo: YoutubeVideoInformation, videoTitle: string) => void;
    submitNewVideoFront: (newVideo: YoutubeVideoInformation, videoTitle: string) => void;
    submitAllVideos: (newVideos: YoutubeVideoInformation[], playlistTitle: string) => void;
}

export const QueueModal = memo(function QueueModal(props: QueueModalProps): JSX.Element {
    const { submitNewVideoEnd, submitNewVideoFront, submitAllVideos } = props;
    const [searchField, setSearchField] = useState<string>("");
    const [searchResults, setSearchResults] = useState<VideoInfo[]>([]);
    const [searchPlaylist, setSearchPlaylist] = useState<PlaylistInfo | null>(null);
    const [userPlaylists, setUserPlaylists] = useState<PlaylistInfo[]>([]);
    const [likedPreview, setLikedPreview] = useState<VideoInfo | null>(null);
    const [playlistSearch, setPlaylistSearch] = useState<string>("");
    const [playlistSort, setPlaylistSort] = useState<number>(getSortCookie());

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
    const clearVideoSearch = (): void => {
        // For some reason manually clearing the value of an input won't update the floating label
        setSearchField("");
        debouncedSearch("");
    };

    const submitFrontFromList = (videoID: VideoCardInfo | VideoInfo, pID: string | undefined): void => {
        if (videoID.duration === undefined) {
            // Rarely-taken path, no need to cache
            RequestVideo(videoID.id, controller, (info) => {
                submitNewVideoFront(
                    {
                        videoID: info.id,
                        duration: info.duration ?? 0
                    },
                    videoID.title
                );
                if (pID)
                    recentPlaylists.pushItem(pID);
            });
        } else {
            submitNewVideoFront(
                {
                    videoID: videoID.id,
                    duration: videoID.duration ?? 0
                },
                videoID.title
            );
            if (pID)
                    recentPlaylists.pushItem(pID);
        }
    };
    const submitEndFromList = (videoID: VideoCardInfo | VideoInfo, pID: string | undefined): void => {
        if (videoID.duration === undefined) {
            // Rarely-taken path, no need to cache
            RequestVideo(videoID.id, controller, (info) => {
                submitNewVideoEnd(
                    {
                        videoID: info.id,
                        duration: info.duration ?? 0
                    },
                    videoID.title
                );
                if (pID)
                    recentPlaylists.pushItem(pID);
            });
        } else {
            submitNewVideoEnd(
                {
                    videoID: videoID.id,
                    duration: videoID.duration ?? 0
                },
                videoID.title
            );
            if (pID)
                    recentPlaylists.pushItem(pID);
        }
    };
    const submitPlaylist = (vids: VideoCardInfo[], info: PlaylistInfo): void => {
        submitAllVideos(
            vids.map((v) => ({
                videoID: v.id,
                duration: v.duration ?? 0
            })),
            info.title
        );
        recentPlaylists.pushItem(info.id);
    };

    const updatePlaylistSort = (srt: number) => {
        setPlaylistSort(srt);
        setSortCookie(srt);
    };

    const sortedPlaylists = sortPlaylist(userPlaylists, playlistSort);
    return (
        <div class={style.queueContainer}>
            <div class={style.queueTabBody}>
                <div class={style.searchDiv}>
                    <div class={style.inputDiv}>
                        <Input floatingLabel label="Search" value={searchField} onChange={updateVideoSearch} />
                        {searchField.length > 0 ? (
                            <button class={style.searchClear} onClick={clearVideoSearch}>
                                <MdClear size="1.5rem" />
                            </button>
                        ) : null}
                    </div>
                    <Dropdown
                        className={style.sortDropdown}
                        base={(open): JSX.Element => (
                            <Button onClick={open} size="small" variant="fab" color="accent">
                                <MdSort size="2rem" />
                            </Button>
                        )}
                        options={
                            sortOptions.map((s, i) => ({
                                display: playlistSort === i ? <strong>{s.display}</strong> : s.display,
                                onClick: () => updatePlaylistSort(i),
                            }))
                        }
                    />
                </div>
                <div class={commonStyle.scrollBox}>
                    {searchPlaylist && (
                        <PlaylistCard
                            info={searchPlaylist}
                            queueVideoEnd={submitEndFromList}
                            queueVideoFront={submitFrontFromList}
                            submitPlaylist={submitPlaylist}
                            searchText=""
                        />
                    )}
                    {searchResults.map((list) => {
                        const queueFront = (): void => submitFrontFromList(list, undefined);
                        const queueEnd = (): void => submitEndFromList(list, undefined);
                        return (
                            <VideoDisplayCard
                                key={list.id}
                                enablePreview={true}
                                info={{ ...list, thumbnailURL: list.thumbnailMaxRes?.url ?? "" }}
                                onClick={queueEnd}
                                actionComponent={<VideoQueueMenu queueFront={queueFront} queueEnd={queueEnd} />}
                            />
                        );
                    })}
                    {likedPreview !== null && playlistSearch.length === 0 && searchResults.length === 0 ? (
                        <LikedVideosCard
                            info={{
                                id: "",
                                channel: "",
                                description: "",
                                title: "Liked Videos",
                                videoCount: 0,
                                thumbnailMaxRes: likedPreview.thumbnailMaxRes
                            }}
                            queueVideoEnd={submitEndFromList}
                            queueVideoFront={submitFrontFromList}
                            submitPlaylist={submitPlaylist}
                            searchText=""
                        />
                    ) : null}
                    {searchResults.length === 0
                        ? sortedPlaylists.map((list) => {
                              return (
                                  <PlaylistCard
                                      key={list.id}
                                      info={list}
                                      queueVideoEnd={submitEndFromList}
                                      queueVideoFront={submitFrontFromList}
                                      submitPlaylist={submitPlaylist}
                                      searchText={playlistSearch.toLocaleUpperCase()}
                                  />
                              );
                          })
                        : null}
                </div>
            </div>
        </div>
    );
});
