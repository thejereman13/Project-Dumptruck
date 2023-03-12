import { Accessor, createEffect, createSignal, For, JSX, Show } from "solid-js";
// import { useGAPIContext, RequestVideosFromPlaylist, RequestLikedVideos } from "../../utils/GAPI";
import { VideoInfo, PlaylistInfo } from "../../utils/YoutubeTypes";
import { RegisterLoadingNotification } from "../Notification";
import { DotLoader } from "../LoadingAnimations";
import { VideoCardInfo, VideoDisplayCard } from "./VideoCard";

import { TbPlaylistAdd } from "solid-icons/tb";
import { TiArrowShuffle } from "solid-icons/ti";
import { BsSkipStartFill } from "solid-icons/bs";

import { style as commonStyle } from "../sharedStyle";
import { css } from "solid-styled-components";
import { RequestLikedVideos, RequestVideosFromPlaylist } from "../../utils/GAPI";
import { siteUser } from "../../Login";

const style = {
    playlistCardButton: css`
        display: flex;
        height: unset;
        padding: 0;
        width: 100%;
        margin: 0 !important;
        flex-flow: column;
    `,

    playlistButtonActive: css`
        position: sticky;
        top: 0;
        z-index: 128;
        background-color: var(--dp2-surface) !important;
        &:hover {
            background-color: var(--dp24-surface) !important;
        }
    `,
    playlistCard: css`
        display: flex;
        flex-flow: column;
        padding: 1rem;
        width: 100%;
    `,
    playlistIcon: css`
        height: 100%;
    `,
    playlistCardInfo: css`
        display: flex;
        flex-flow: row;
        height: 4rem;
    `,
    playlistVideos: css`
        margin-left: 2rem;
        height: 0;
        overflow-y: auto;
        transition: height 0.25s ease;
        background-color: var(--dp8-surface);
    `,
    playlistVideosExpanded: css`
        height: unset;
    `,
};

interface PlaylistDisplayProps {
    info: PlaylistInfo;
    videoInfo: VideoCardInfo[];
    queueVideoFront: (id: VideoCardInfo, pID: string) => void;
    queueVideoEnd: (id: VideoCardInfo, pID: string) => void;
    queueAll: () => void;
    shuffleQueue: () => void;
    loading: boolean;
    expanded: boolean;
    setExpanded: (expanded: boolean) => void;
}

function PlaylistDisplayCard(props: PlaylistDisplayProps): JSX.Element {
    const expandVideos = (): void => props.setExpanded(true);
    const hideVideos = (): void => props.setExpanded(false);

    const cardContent = (
        <div class={style.playlistCard}>
            <div class="flex flex-row h-16">
                <Show when={props.info.thumbnailMaxRes?.url}>
                    <img class={style.playlistIcon} src={props.info.thumbnailMaxRes!.url} />
                </Show>
                <div class="h-full pl-4 text-start overflow-hidden font-medium">
                    <div class={`text-lg normal-case ${commonStyle.textEllipsis}`}>{props.info.title}</div>
                    <div class={`normal-case ${commonStyle.textEllipsis}`}>{props.info.channel}</div>
                </div>
                <Show when={props.loading}>
                    <DotLoader />
                </Show>
                <div class={commonStyle.videoActionDiv}>
                    <span class="tooltip" data-tip="Queue All">
                        <button
                            class="btn btn-primary btn-circle"
                            onClick={(e): void => {
                                props.queueAll();
                                e.stopPropagation();
                            }}
                        >
                            <TbPlaylistAdd size="2rem" />
                        </button>
                    </span>
                    <span class="tooltip" data-tip="Shuffle All">
                        <button
                            class="btn btn-primary btn-circle"
                            onClick={(e): void => {
                                props.shuffleQueue();
                                e.stopPropagation();
                            }}
                        >
                            <TiArrowShuffle size="2rem" />
                        </button>
                    </span>
                </div>
            </div>
        </div>
    );

    const cardVideos = (
        <div class="ml-8 bg-neutral-800">
            <Show when={props.expanded && props.videoInfo.length}>
                <For each={props.videoInfo}>
                    {(vid) => {
                        const queueFront = (): void => props.queueVideoFront(vid, props.info.id);
                        const queueEnd = (): void => props.queueVideoEnd(vid, props.info.id);
                        return (
                            <VideoDisplayCard
                                info={vid}
                                enablePreview={true}
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
            </Show>
        </div>
    );

    return (
        <Show when={props.videoInfo}>
            <div>
                <button
                    class={[
                        "btn",
                        "btn-ghost",
                        "no-animation",
                        style.playlistCardButton,
                        props.expanded ? style.playlistButtonActive : "",
                    ].join(" ")}
                    onClick={props.expanded ? hideVideos : expandVideos}
                >
                    {cardContent}
                </button>
                {cardVideos}
            </div>
        </Show>
    );
}

export interface PlaylistCardProps {
    info: PlaylistInfo;
    queueVideoFront: (id: VideoCardInfo, pID: string) => void;
    queueVideoEnd: (id: VideoCardInfo, pID: string) => void;
    submitPlaylist: (vids: VideoCardInfo[], info: PlaylistInfo) => void;
    searchText: string;
}

export function PlaylistCard(props: PlaylistCardProps): JSX.Element | null {
    const [videoInfo, setVideoInfo] = createSignal<VideoCardInfo[]>([]);
    const [durationsLoaded, setDurationsLoaded] = createSignal<boolean>(false);
    const [loading, setLoading] = createSignal<boolean>(false);
    const [videoExpanded, setVideoExpanded] = createSignal<boolean>(false);

    createEffect(() => {
        const user = siteUser();
        if (user?.access_token && props.info.id && videoExpanded() && videoInfo().length === 0) {
            setLoading(true);
            RequestVideosFromPlaylist(
                props.info.id,
                user.access_token,
                (infos: VideoInfo[] | undefined, final: boolean) => {
                    if (infos)
                        setVideoInfo(
                            infos.map((v) => ({
                                id: v.id,
                                title: v.title,
                                channel: v.channel,
                                thumbnailURL: v.thumbnailMaxRes?.url ?? "",
                                duration: v.duration,
                            }))
                        );
                    setDurationsLoaded(final);
                    if (final) {
                        setLoading(false);
                    }
                }
            );
        }
    });

    const retrieveVideoInfo = (callback?: (vids: VideoCardInfo[], info: PlaylistInfo) => void): void => {
        if (!props.info.id) return;
        const user = siteUser();
        if (((!videoExpanded() && videoInfo().length === 0) || !durationsLoaded()) && user?.access_token) {
            const finish = RegisterLoadingNotification("Requesting Playlist Information");
            RequestVideosFromPlaylist(
                props.info.id,
                user.access_token,
                (infos: VideoInfo[] | undefined, final: boolean) => {
                    if (final) {
                        finish();
                        if (infos)
                            callback?.(
                                infos.map((v) => ({
                                    id: v.id,
                                    title: v.title,
                                    channel: v.channel,
                                    thumbnailURL: v.thumbnailMaxRes?.url ?? "",
                                    duration: v.duration,
                                })),
                                props.info
                            );
                    }
                }
            );
        } else {
            callback?.(videoInfo(), props.info);
        }
    };

    const queueAll = (): void => {
        retrieveVideoInfo(props.submitPlaylist);
    };

    const shuffleQueue = (): void => {
        retrieveVideoInfo((array: VideoCardInfo[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * i);
                const temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            props.submitPlaylist?.(array, props.info);
        });
    };

    const filteredVideos = () =>
        props.searchText.length > 0 && videoExpanded()
            ? videoInfo().filter(
                  (v) =>
                      v.title.toLocaleUpperCase().includes(props.searchText) ||
                      v.channel.toLocaleUpperCase().includes(props.searchText)
              )
            : videoInfo();

    const shouldntDisplay = () =>
        props.searchText.length > 0 &&
        (!videoExpanded() || filteredVideos().length === 0) &&
        !props.info.title.toLocaleUpperCase().includes(props.searchText);

    return (
        <Show when={!shouldntDisplay()} fallback={null}>
            <PlaylistDisplayCard
                expanded={videoExpanded()}
                info={props.info}
                loading={loading()}
                queueVideoEnd={props.queueVideoEnd}
                queueVideoFront={props.queueVideoFront}
                queueAll={queueAll}
                setExpanded={setVideoExpanded}
                shuffleQueue={shuffleQueue}
                videoInfo={filteredVideos()}
            />
        </Show>
    );
}

export function LikedVideosCard(props: PlaylistCardProps): JSX.Element {
    const [videoInfo, setVideoInfo] = createSignal<VideoCardInfo[]>([]);
    const [videoExpanded, setVideoExpanded] = createSignal<boolean>(false);
    const [durationsLoaded, setDurationsLoaded] = createSignal<boolean>(false);
    const [loading, setLoading] = createSignal<boolean>(false);

    createEffect(() => {
        const user = siteUser();
        if (user?.access_token && videoExpanded() && videoInfo().length === 0) {
            setLoading(true);
            RequestLikedVideos(user.access_token, (infos: VideoInfo[] | undefined, final: boolean) => {
                if (infos)
                    setVideoInfo(
                        infos.map((v) => ({
                            id: v.id,
                            title: v.title,
                            channel: v.channel,
                            thumbnailURL: v.thumbnailMaxRes?.url ?? "",
                            duration: v.duration,
                        }))
                    );
                setDurationsLoaded(final);
                if (final) {
                    setLoading(false);
                }
            });
        }
    });

    const retrieveVideoInfo = (callback?: (vids: VideoCardInfo[], info: PlaylistInfo) => void): void => {
        const user = siteUser();
        if (((!videoExpanded() && videoInfo().length === 0) || !durationsLoaded()) && user?.access_token) {
            const finish = RegisterLoadingNotification("Requesting Video Information");
            RequestLikedVideos(user.access_token, (infos: VideoInfo[] | undefined, final: boolean) => {
                if (final) {
                    finish();
                    if (infos)
                        callback?.(
                            infos.map((v) => ({
                                id: v.id,
                                title: v.title,
                                channel: v.channel,
                                thumbnailURL: v.thumbnailMaxRes?.url ?? "",
                                duration: v.duration,
                            })),
                            props.info
                        );
                }
            });
        } else {
            callback?.(videoInfo(), props.info);
        }
    };

    const queueAll = (): void => {
        retrieveVideoInfo(props.submitPlaylist);
    };

    const shuffleQueue = (): void => {
        retrieveVideoInfo((array: VideoCardInfo[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * i);
                const temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            props.submitPlaylist?.(array, props.info);
        });
    };

    return (
        <PlaylistDisplayCard
            expanded={videoExpanded()}
            info={props.info}
            loading={loading()}
            queueVideoEnd={props.queueVideoEnd}
            queueVideoFront={props.queueVideoFront}
            queueAll={queueAll}
            setExpanded={setVideoExpanded}
            shuffleQueue={shuffleQueue}
            videoInfo={videoInfo()}
        />
    );
}
