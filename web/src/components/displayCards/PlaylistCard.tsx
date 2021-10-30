import { h, JSX } from "preact";
import { useState, useEffect } from "preact/hooks";
import { useGAPIContext, RequestVideosFromPlaylist, RequestLikedVideos } from "../../utils/GAPI";
import Button from "preact-mui/lib/button";
import { VideoInfo, PlaylistInfo } from "../../utils/YoutubeTypes";
import { Tooltip } from "../Popup";
import { useAbortController } from "../../utils/AbortController";
import { RegisterLoadingNotification } from "../Notification";
import { DotLoader } from "../LoadingAnimations";
import { VideoCardInfo, VideoDisplayCard } from "./VideoCard";

import MdPlaylistAdd from "@meronex/icons/md/MdPlaylistAdd";
import MdShuffle from "@meronex/icons/md/MdShuffle";

import {style as commonStyle } from "../sharedStyle";
import { VideoQueueMenu } from "./QueueMenu";
import { css } from "@linaria/core";

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
    playlistInfo: css`
        height: 100%;
        flex-direction: column;
        padding-left: 1rem;
        text-align: start;
        overflow: hidden;
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
    const {
        info,
        queueVideoEnd,
        queueVideoFront,
        loading,
        queueAll,
        shuffleQueue,
        videoInfo,
        expanded,
        setExpanded
    } = props;

    const expandVideos = (): void => setExpanded(true);
    const hideVideos = (): void => setExpanded(false);

    const cardContent = info && (
        <div class={style.playlistCard}>
            <div class={style.playlistCardInfo}>
                {info.thumbnailMaxRes && info.thumbnailMaxRes.url && (
                    <img class={style.playlistIcon} src={info.thumbnailMaxRes.url} />
                )}
                <div class={style.playlistInfo}>
                    <div class={["mui--text-subhead", commonStyle.textEllipsis].join(" ")}>{info.title}</div>
                    <div class={["mui--text-body1", commonStyle.textEllipsis].join(" ")}>{info.channel}</div>
                </div>
                {loading && <DotLoader />}
                <div class={commonStyle.videoActionDiv}>
                    <Tooltip content="Queue All">
                        <Button
                            size="small"
                            variant="fab"
                            onClick={(e): void => {
                                queueAll();
                                e.stopPropagation();
                            }}
                        >
                            <MdPlaylistAdd size="2rem" />
                        </Button>
                    </Tooltip>
                    <Tooltip content="Shuffle and Queue All">
                        <Button
                            size="small"
                            variant="fab"
                            onClick={(e): void => {
                                shuffleQueue();
                                e.stopPropagation();
                            }}
                        >
                            <MdShuffle size="2rem" />
                        </Button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );

    const cardVideos = (
        <div
            class={[style.playlistVideos, expanded && videoInfo.length > 0 ? style.playlistVideosExpanded : ""].join(
                " "
            )}
        >
            {expanded &&
                videoInfo.map((vid) => {
                    const queueFront = (): void => queueVideoFront(vid, info.id);
                    const queueEnd = (): void => queueVideoEnd(vid, info.id);
                    return (
                        <VideoDisplayCard
                            key={vid.id}
                            info={vid}
                            enablePreview={true}
                            onClick={queueEnd}
                            actionComponent={<VideoQueueMenu queueEnd={queueEnd} queueFront={queueFront} />}
                        />
                    );
                })}
        </div>
    );

    return videoInfo ? (
        <div>
            <Button
                className={[
                    "mui-btn",
                    "mui-btn--flat",
                    style.playlistCardButton,
                    expanded ? style.playlistButtonActive : ""
                ].join(" ")}
                variant="flat"
                onClick={expanded ? hideVideos : expandVideos}
            >
                {cardContent}
            </Button>
            {cardVideos}
        </div>
    ) : (
        <div />
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
    const { info, queueVideoEnd, queueVideoFront, submitPlaylist, searchText } = props;
    const [videoInfo, setVideoInfo] = useState<VideoCardInfo[]>([]);
    const [durationsLoaded, setDurationsLoaded] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [videoExpanded, setVideoExpanded] = useState<boolean>(false);

    const GAPIContext = useGAPIContext();

    const controller = useAbortController();

    useEffect(() => {
        if (GAPIContext?.isAPILoaded() && info.id && videoExpanded && videoInfo.length === 0) {
            setLoading(true);
            RequestVideosFromPlaylist(info.id, controller, (infos: VideoInfo[] | undefined, final: boolean) => {
                if (infos)
                    setVideoInfo(
                        infos.map((v) => ({
                            id: v.id,
                            title: v.title,
                            channel: v.channel,
                            thumbnailURL: v.thumbnailMaxRes?.url ?? "",
                            duration: v.duration
                        }))
                    );
                setDurationsLoaded(final);
                if (final) {
                    setLoading(false);
                }
            });
        }
    }, [GAPIContext, controller, info.id, videoExpanded, videoInfo]);

    const retrieveVideoInfo = (callback?: (vids: VideoCardInfo[], info: PlaylistInfo) => void): void => {
        if (!info.id) return;
        if (((!videoExpanded && videoInfo.length === 0) || !durationsLoaded) && GAPIContext?.isAPILoaded()) {
            const finish = RegisterLoadingNotification("Requesting Playlist Information");
            RequestVideosFromPlaylist(info.id, controller, (infos: VideoInfo[] | undefined, final: boolean) => {
                if (final) {
                    finish();
                    if (infos)
                        callback?.(
                            infos.map((v) => ({
                                id: v.id,
                                title: v.title,
                                channel: v.channel,
                                thumbnailURL: v.thumbnailMaxRes?.url ?? "",
                                duration: v.duration
                            })),
                            info
                        );
                }
            });
        } else {
            callback?.(videoInfo, info);
        }
    };

    const queueAll = (): void => {
        retrieveVideoInfo(submitPlaylist);
    };

    const shuffleQueue = (): void => {
        retrieveVideoInfo((array: VideoCardInfo[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * i);
                const temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            submitPlaylist?.(array, info);
        });
    };

    const filteredVideos = (searchText.length > 0 && videoExpanded)
        ? videoInfo.filter((v) => v.title.toLocaleUpperCase().includes(searchText) || v.channel.toLocaleUpperCase().includes(searchText))
        : videoInfo;

    if (searchText.length > 0 && (!videoExpanded || filteredVideos.length === 0)) {
        if (!info.title.toLocaleUpperCase().includes(searchText))
            return null;
    }

    return (
        <PlaylistDisplayCard
            expanded={videoExpanded}
            info={info}
            loading={loading}
            queueVideoEnd={queueVideoEnd}
            queueVideoFront={queueVideoFront}
            queueAll={queueAll}
            setExpanded={setVideoExpanded}
            shuffleQueue={shuffleQueue}
            videoInfo={filteredVideos}
        />
    );
}

export function LikedVideosCard(props: PlaylistCardProps): JSX.Element {
    const { info, queueVideoEnd, queueVideoFront, submitPlaylist } = props;
    const [videoInfo, setVideoInfo] = useState<VideoCardInfo[]>([]);
    const [videoExpanded, setVideoExpanded] = useState<boolean>(false);
    const [durationsLoaded, setDurationsLoaded] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const GAPIContext = useGAPIContext();
    const controller = useAbortController();

    useEffect(() => {
        if (GAPIContext?.isAPILoaded() && videoExpanded && videoInfo.length === 0) {
            setLoading(true);
            RequestLikedVideos(controller, (infos: VideoInfo[] | undefined, final: boolean) => {
                if (infos)
                    setVideoInfo(
                        infos.map((v) => ({
                            id: v.id,
                            title: v.title,
                            channel: v.channel,
                            thumbnailURL: v.thumbnailMaxRes?.url ?? "",
                            duration: v.duration
                        }))
                    );
                setDurationsLoaded(final);
                if (final) {
                    setLoading(false);
                }
            });
        }
    }, [GAPIContext, controller, info.id, videoExpanded, videoInfo]);

    const retrieveVideoInfo = (callback?: (vids: VideoCardInfo[], info: PlaylistInfo) => void): void => {
        if (((!videoExpanded && videoInfo.length === 0) || !durationsLoaded) && GAPIContext?.isAPILoaded()) {
            const finish = RegisterLoadingNotification("Requesting Video Information");
            RequestLikedVideos(controller, (infos: VideoInfo[] | undefined, final: boolean) => {
                if (final) {
                    finish();
                    if (infos)
                        callback?.(
                            infos.map((v) => ({
                                id: v.id,
                                title: v.title,
                                channel: v.channel,
                                thumbnailURL: v.thumbnailMaxRes?.url ?? "",
                                duration: v.duration
                            })),
                            info
                        );
                }
            });
        } else {
            callback?.(videoInfo, info);
        }
    };

    const queueAll = (): void => {
        retrieveVideoInfo(submitPlaylist);
    };

    const shuffleQueue = (): void => {
        retrieveVideoInfo((array: VideoCardInfo[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * i);
                const temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            submitPlaylist?.(array, info);
        });
    };

    return (
        <PlaylistDisplayCard
            expanded={videoExpanded}
            info={info}
            loading={loading}
            queueVideoEnd={queueVideoEnd}
            queueVideoFront={queueVideoFront}
            queueAll={queueAll}
            setExpanded={setVideoExpanded}
            shuffleQueue={shuffleQueue}
            videoInfo={videoInfo}
        />
    );
}
