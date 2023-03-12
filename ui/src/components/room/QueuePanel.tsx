import { VideoInfo, PlaylistInfo, videoIDFromURL, playlistIDFromURL } from "../../utils/YoutubeTypes";
import { RequestAllPlaylists, RequestVideo, RequestLikedVideos, RequestPlaylist } from "../../utils/GAPI";
import { VideoDisplayCard, VideoCardInfo } from "../../components/displayCards/VideoCard";
import { LikedVideosCard, PlaylistCard } from "../../components/displayCards/PlaylistCard";
import { YoutubeVideoInformation } from "../../utils/BackendTypes";
import { useAbortController } from "../../utils/AbortController";

import { style as commonStyle } from "./panelStyle";
import { CgSortAz } from "solid-icons/cg";
import { IoCloseSharp } from "solid-icons/io";
import { getSortCookie, setSortCookie } from "../../utils/Cookies";
import { LRUList } from "../../utils/Caching";
import { css } from "solid-styled-components";
import { createEffect, createSignal, For, JSX, Show } from "solid-js";
import { debounce } from "@solid-primitives/scheduled";
import { siteUser } from "../../Login";
import { BsSkipStartFill } from "solid-icons/bs";

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
    },
];

function sortPlaylist(list: PlaylistInfo[], sortType: number): PlaylistInfo[] {
    switch (sortType) {
        case 0:
            return list;
        case 1:
            return [...list].reverse();
        case 2:
            const recent = recentPlaylists
                .getList()
                .map((id) => list.find((p) => p.id === id))
                .filter((p) => p !== undefined) as PlaylistInfo[];
            return [...recent, ...list.filter((p) => !recent.includes(p))];
        case 3:
            return [...list].sort((p, q) => (p.title.toLocaleUpperCase() > q.title.toLocaleUpperCase() ? 1 : -1));
        case 4:
            return [...list].sort((p, q) => (p.title.toLocaleUpperCase() > q.title.toLocaleUpperCase() ? -1 : 1));
        default:
            return list;
    }
}

export interface QueueModalProps {
    submitNewVideoEnd: (newVideo: YoutubeVideoInformation, videoTitle: string) => void;
    submitNewVideoFront: (newVideo: YoutubeVideoInformation, videoTitle: string) => void;
    submitAllVideos: (newVideos: YoutubeVideoInformation[], playlistTitle: string) => void;
}

export function QueueModal(props: QueueModalProps): JSX.Element {
    const [searchField, setSearchField] = createSignal<string>("");
    const [searchResults, setSearchResults] = createSignal<VideoInfo[]>([]);
    const [searchPlaylist, setSearchPlaylist] = createSignal<PlaylistInfo | null>(null);
    const [userPlaylists, setUserPlaylists] = createSignal<PlaylistInfo[]>([]);
    const [likedPreview, setLikedPreview] = createSignal<VideoInfo | null>(null);
    const [playlistSearch, setPlaylistSearch] = createSignal<string>("");
    const [playlistSort, setPlaylistSort] = createSignal<number>(getSortCookie());

    const controller = useAbortController();

    const debouncedSearch = debounce((search: string) => {
        const user = siteUser();
        if (user && user.access_token && search.length > 0) {
            const id = videoIDFromURL(search);
            const pid = playlistIDFromURL(search);
            if (id)
                RequestVideo(id, user.access_token, (vid) => {
                    if (!controller.signal.aborted) {
                        setSearchResults([vid]);
                        setSearchPlaylist(null);
                    }
                });
            else if (pid)
                RequestPlaylist(pid, user.access_token, (play) => {
                    if (!controller.signal.aborted) {
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
    }, 200);

    createEffect(() => {
        const user = siteUser();
        if (user?.access_token) {
            RequestAllPlaylists(user.access_token, (list) => {
                if (list) setUserPlaylists(list);
            });
            RequestLikedVideos(
                user.access_token,
                (vids) => {
                    if (vids && vids.length > 0) setLikedPreview(vids[0]);
                },
                true
            );
        }
    });

    const updateVideoSearch: JSX.EventHandler<HTMLInputElement, Event> = (e): void => {
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
            const user = siteUser();
            // Rarely-taken path, no need to cache
            if (user?.access_token) {
                RequestVideo(videoID.id, user.access_token, (info) => {
                    props.submitNewVideoFront(
                        {
                            videoID: info.id,
                            duration: info.duration ?? 0,
                        },
                        videoID.title
                    );
                    if (pID) recentPlaylists.pushItem(pID);
                });
            }
        } else {
            props.submitNewVideoFront(
                {
                    videoID: videoID.id,
                    duration: videoID.duration ?? 0,
                },
                videoID.title
            );
            if (pID) recentPlaylists.pushItem(pID);
        }
    };
    const submitEndFromList = (videoID: VideoCardInfo | VideoInfo, pID: string | undefined): void => {
        if (videoID.duration === undefined) {
            const user = siteUser();
            // Rarely-taken path, no need to cache
            if (user?.access_token) {
                RequestVideo(videoID.id, user.access_token, (info) => {
                    props.submitNewVideoEnd(
                        {
                            videoID: info.id,
                            duration: info.duration ?? 0,
                        },
                        videoID.title
                    );
                    if (pID) recentPlaylists.pushItem(pID);
                });
            }
        } else {
            props.submitNewVideoEnd(
                {
                    videoID: videoID.id,
                    duration: videoID.duration ?? 0,
                },
                videoID.title
            );
            if (pID) recentPlaylists.pushItem(pID);
        }
    };
    const submitPlaylist = (vids: VideoCardInfo[], info: PlaylistInfo): void => {
        props.submitAllVideos(
            vids.map((v) => ({
                videoID: v.id,
                duration: v.duration ?? 0,
            })),
            info.title
        );
        recentPlaylists.pushItem(info.id);
    };

    const updatePlaylistSort = (srt: number) => {
        setPlaylistSort(srt);
        setSortCookie(srt);
    };

    const sortedPlaylists = () => sortPlaylist(userPlaylists(), playlistSort());
    return (
        <div class={style.queueContainer}>
            <div class={style.queueTabBody}>
                <div class={style.searchDiv}>
                    <div class={style.inputDiv}>
                        <input
                            class="input input-ghost w-full h-8"
                            placeholder="Search"
                            value={searchField()}
                            onChange={updateVideoSearch}
                        />
                        <Show when={searchField.length > 0}>
                            <button class={style.searchClear} onClick={clearVideoSearch}>
                                <IoCloseSharp size="1.5rem" />
                            </button>
                        </Show>
                    </div>
                    <div classList={{ [style.sortDropdown]: true, "dropdown dropdown-end": true }}>
                        <label tabindex="0" class="btn btn-primary btn-ghost btn-circle btn-sm">
                            <CgSortAz size="2rem" />
                        </label>
                        <ul tabindex="0" class="dropdown-content menu shadow rounded-box bg-neutral-700 min-w-[8rem]">
                            <For each={sortOptions}>
                                {(s, i) => (
                                    <li>
                                        <a onClick={() => updatePlaylistSort(i())}>
                                            {playlistSort() === i() ? <strong>{s.display}</strong> : s.display}
                                        </a>
                                    </li>
                                )}
                            </For>
                        </ul>
                    </div>
                </div>
                <div class={commonStyle.scrollBox}>
                    <Show when={searchPlaylist()}>
                        <PlaylistCard
                            info={searchPlaylist()!}
                            queueVideoEnd={submitEndFromList}
                            queueVideoFront={submitFrontFromList}
                            submitPlaylist={submitPlaylist}
                            searchText=""
                        />
                    </Show>
                    <For each={searchResults()}>
                        {(list) => {
                            const queueFront = (): void => submitFrontFromList(list, undefined);
                            const queueEnd = (): void => submitEndFromList(list, undefined);
                            return (
                                <VideoDisplayCard
                                    enablePreview={true}
                                    info={{ ...list, thumbnailURL: list.thumbnailMaxRes?.url ?? "" }}
                                    onClick={queueEnd}
                                    actionComponent={
                                        <button class="btn btn-circle btn-sm btn-ghost text-primary tooltip tooltip-left inline-flex" data-tip="Queue Front">
                                            <BsSkipStartFill size="1.5rem" onClick={queueFront} />
                                        </button>
                                    }
                                />
                            );
                        }}
                    </For>
                    <Show when={likedPreview() && playlistSearch().length === 0 && searchResults().length === 0}>
                        <LikedVideosCard
                            info={{
                                id: "",
                                channel: "",
                                description: "",
                                title: "Liked Videos",
                                videoCount: 0,
                                thumbnailMaxRes: likedPreview()!.thumbnailMaxRes,
                            }}
                            queueVideoEnd={submitEndFromList}
                            queueVideoFront={submitFrontFromList}
                            submitPlaylist={submitPlaylist}
                            searchText=""
                        />
                    </Show>
                    <Show when={searchResults().length === 0}>
                        <For each={sortedPlaylists()}>
                            {(list) => (
                                <PlaylistCard
                                    info={list}
                                    queueVideoEnd={submitEndFromList}
                                    queueVideoFront={submitFrontFromList}
                                    submitPlaylist={submitPlaylist}
                                    searchText={playlistSearch().toLocaleUpperCase()}
                                />
                            )}
                        </For>
                    </Show>
                </div>
            </div>
        </div>
    );
}
