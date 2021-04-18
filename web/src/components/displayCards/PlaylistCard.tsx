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

import { MdPlaylistAdd, MdShuffle } from "react-icons/md";

import * as style from "./PlaylistCard.css";
import * as commonStyle from "./DisplayCard.css";

interface PlaylistDisplayProps {
    info: PlaylistInfo;
    videoInfo: VideoCardInfo[];
    onVideoClick: (id: VideoCardInfo) => void;
    queueAll: () => void;
    shuffleQueue: () => void;
    loading: boolean;
    expanded: boolean;
    setExpanded: (expanded: boolean) => void;
}

function PlaylistDisplayCard(props: PlaylistDisplayProps): JSX.Element {
    const { info, onVideoClick, loading, queueAll, shuffleQueue, videoInfo, expanded, setExpanded } = props;

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
                videoInfo.map((vid) => (
                    <VideoDisplayCard
                        key={vid.id}
                        info={vid}
                        enablePreview={true}
                        onClick={onVideoClick ? (): void => onVideoClick(vid) : undefined}
                    />
                ))}
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
    onVideoClick: (id: VideoCardInfo) => void;
    submitPlaylist: (vids: VideoCardInfo[], info: PlaylistInfo) => void;
}

export function PlaylistCard(props: PlaylistCardProps): JSX.Element {
    const { info, onVideoClick, submitPlaylist } = props;
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

    return (
        <PlaylistDisplayCard
            expanded={videoExpanded}
            info={info}
            loading={loading}
            onVideoClick={onVideoClick}
            queueAll={queueAll}
            setExpanded={setVideoExpanded}
            shuffleQueue={shuffleQueue}
            videoInfo={videoInfo}
        />
    );
}

export function LikedVideosCard(props: PlaylistCardProps): JSX.Element {
    const { info, onVideoClick, submitPlaylist } = props;
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
            onVideoClick={onVideoClick}
            queueAll={queueAll}
            setExpanded={setVideoExpanded}
            shuffleQueue={shuffleQueue}
            videoInfo={videoInfo}
        />
    );
}
