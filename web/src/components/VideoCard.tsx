import { h, JSX } from "preact";
import * as style from "./style.css";
import { useState, useEffect, Ref, useRef } from "preact/hooks";
import { useGAPIContext, RequestVideosFromPlaylist, RequestLikedVideos } from "../utils/GAPI";
import Button from "preact-mui/lib/button";
import { VideoInfo, PlaylistInfo, durationToString } from "../utils/YoutubeTypes";
import { RequestVideoPreview } from "../utils/RestCalls";
import { Tooltip } from "../components/Popup";
import { useAbortController } from "./AbortController";
import { RegisterLoadingNotification } from "./Notification";
import { memo } from "preact/compat";
import { DotLoader } from "./LoadingAnimations";

export interface VideoCardInfo {
    id: string;
    title: string;
    channel: string;
    thumbnailURL: string;
    duration?: number;
}

export interface VideoDisplayCardProps {
    info: VideoCardInfo;
    onClick?: (id: string) => void;
    actionComponent?: JSX.Element;
}

export function VideoDisplayCard(props: VideoDisplayCardProps): JSX.Element {
    const { info, onClick, actionComponent } = props;
    const cardClick = (): void => {
        onClick?.(info.id);
    };

    const cardContent = (
        <div class={style.VideoCard}>
            {info.thumbnailURL && (
                <img class={style.VideoIcon} src={info.thumbnailURL.replace("hqdefault", "mqdefault")} />
            )}
            <div class={["mui--text-body1", style.VideoDuration].join(" ")}>{durationToString(info.duration)}</div>
            <div class={style.VideoInfo}>
                <Tooltip content={info.title} delay={800}>
                    <div class={["mui--text-subhead", style.textEllipsis].join(" ")}>{info.title}</div>
                </Tooltip>
                <div class={["mui--text-body1", style.textEllipsis].join(" ")}>
                    {info.channel?.length > 0 ? info.channel : ". . ."}
                </div>
            </div>
            {actionComponent !== undefined && <div class={style.VideoActionDiv}>{actionComponent}</div>}
        </div>
    );

    return onClick ? (
        <Button
            className={["mui-btn", "mui-btn--flat", style.VideoCardButton].join(" ")}
            variant="flat"
            onClick={cardClick}
        >
            {cardContent}
        </Button>
    ) : (
        <div>{cardContent}</div>
    );
}

export interface VideoCardProps {
    videoID: string;
    duration?: number;
    onClick?: (id: string) => void;
    actionComponent?: JSX.Element;
}

let infoStore: VideoCardInfo[] = [];
const infoStoreLength = 128;

function pushInfoStore(videoInfo: VideoCardInfo): VideoCardInfo {
    if (infoStore.includes(videoInfo)) return videoInfo;
    if (infoStore.push(videoInfo) > infoStoreLength) infoStore = infoStore.slice(1);
    return videoInfo;
}

export const VideoCard = memo(
    function VideoCard(props: VideoCardProps): JSX.Element {
        const { videoID, duration, onClick, actionComponent } = props;
        const [videoInfo, setVideoInfo] = useState<VideoCardInfo | null>(null);

        const controller = useAbortController();

        const vidID = useRef<VideoInfo>(null);

        useEffect(() => {
            if (videoID) {
                const ind = infoStore.findIndex(inf => inf.id === videoID);
                if (ind >= 0) {
                    setVideoInfo(infoStore[ind]);
                } else {
                    RequestVideoPreview(videoID, controller).then((info: VideoInfo | null) => {
                        if (info) {
                            setVideoInfo(
                                pushInfoStore({
                                    id: info.id,
                                    title: info.title,
                                    channel: info.channel,
                                    duration: duration,
                                    thumbnailURL: info.thumbnailMaxRes.url
                                })
                            );
                            vidID.current = info;
                        }
                    });
                }
            }
        }, [videoID, duration, controller]);

        const workingInfo = infoStore.find(inf => inf.id === videoID) ?? videoInfo;
        return workingInfo ? (
            <VideoDisplayCard info={workingInfo} onClick={onClick} actionComponent={actionComponent} />
        ) : (
            <div />
        );
    },
    (prev: VideoCardProps, next: VideoCardProps) => {
        const same = prev.videoID === next.videoID;
        return same;
    }
);

export interface PlaylistCardProps {
    info: PlaylistInfo;
    onVideoClick?: (id: VideoCardInfo) => void;
    onPlaylistClick?: (vids: VideoCardInfo[], info: PlaylistInfo) => void;
    parentController: Ref<AbortController>;
}

export function PlaylistCard(props: PlaylistCardProps): JSX.Element {
    const { info, onVideoClick, onPlaylistClick, parentController } = props;
    const [videoInfo, setVideoInfo] = useState<VideoCardInfo[]>([]);
    const [videoExpanded, setVideoExpanded] = useState<boolean>(false);
    const [durationsLoaded, setDurationsLoaded] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const GAPIContext = useGAPIContext();

    const controller = useAbortController();

    const expandVideos = (): void => setVideoExpanded(true);
    const hideVideos = (): void => setVideoExpanded(false);

    useEffect(() => {
        if (GAPIContext?.isAPILoaded() && info.id && videoExpanded && videoInfo.length === 0) {
            setLoading(true);
            RequestVideosFromPlaylist(info.id, controller, (infos: VideoInfo[] | undefined, final: boolean) => {
                if (infos)
                    setVideoInfo(
                        infos.map(v => ({
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
            RequestVideosFromPlaylist(info.id, parentController, (infos: VideoInfo[] | undefined, final: boolean) => {
                if (final) {
                    finish();
                    if (infos)
                        callback?.(
                            infos.map(v => ({
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

    const queueAll = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        retrieveVideoInfo(onPlaylistClick);
        event.stopPropagation();
    };

    const shuffleQueue = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        retrieveVideoInfo((array: VideoCardInfo[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * i);
                const temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            onPlaylistClick?.(array, info);
        });
        event.stopPropagation();
    };

    const cardContent = info && (
        <div class={style.PlaylistCard}>
            <div class={style.PlaylistCardInfo}>
                {info.thumbnailMaxRes && info.thumbnailMaxRes.url && (
                    <img class={style.PlaylistIcon} src={info.thumbnailMaxRes.url} />
                )}
                <div class={style.PlaylistInfo}>
                    <div class={["mui--text-subhead", style.textEllipsis].join(" ")}>{info.title}</div>
                    <div class={["mui--text-body1", style.textEllipsis].join(" ")}>{info.channel}</div>
                </div>
                {loading && <DotLoader />}
                <div class={style.VideoActionDiv}>
                    <Tooltip content="Queue All">
                        <Button size="small" variant="fab" onClick={queueAll}>
                            <i style={{ fontSize: "32px" }} class="material-icons">
                                play_arrow
                            </i>
                        </Button>
                    </Tooltip>
                    <Tooltip content="Shuffle and Queue All">
                        <Button size="small" variant="fab" onClick={shuffleQueue}>
                            <i style={{ fontSize: "32px" }} class="material-icons">
                                shuffle
                            </i>
                        </Button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );

    const cardVideos = (
        <div
            class={[
                style.PlaylistVideos,
                videoExpanded && videoInfo.length > 0 ? style.PlaylistVideosExpanded : ""
            ].join(" ")}
        >
            {videoExpanded &&
                videoInfo.map(vid => (
                    <VideoDisplayCard
                        key={vid.id}
                        info={vid}
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
                    style.VideoCardButton,
                    videoExpanded ? style.PlaylistButtonActive : ""
                ].join(" ")}
                variant="flat"
                onClick={videoExpanded ? hideVideos : expandVideos}
            >
                {cardContent}
            </Button>
            {cardVideos}
        </div>
    ) : (
        <div />
    );
}

export interface LikedVideosCardProps {
    info: PlaylistInfo;
    onVideoClick?: (id: VideoCardInfo) => void;
    onPlaylistClick?: (vids: VideoCardInfo[], info: PlaylistInfo) => void;
    parentController: Ref<AbortController>;
}

export function LikedVideosCard(props: LikedVideosCardProps): JSX.Element {
    const { info, onVideoClick, onPlaylistClick, parentController } = props;
    const [videoInfo, setVideoInfo] = useState<VideoCardInfo[]>([]);
    const [videoExpanded, setVideoExpanded] = useState<boolean>(false);
    const [durationsLoaded, setDurationsLoaded] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const GAPIContext = useGAPIContext();

    const controller = useAbortController();

    const expandVideos = (): void => setVideoExpanded(true);
    const hideVideos = (): void => setVideoExpanded(false);

    useEffect(() => {
        setVideoInfo([]);
    }, [info.id]);

    useEffect(() => {
        if (GAPIContext?.isAPILoaded() && videoExpanded && videoInfo.length === 0) {
            setLoading(true);
            RequestLikedVideos(controller, (infos: VideoInfo[] | undefined, final: boolean) => {
                if (infos)
                    setVideoInfo(
                        infos.map(v => ({
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
            RequestLikedVideos(parentController, (infos: VideoInfo[] | undefined, final: boolean) => {
                if (final) {
                    finish();
                    if (infos)
                        callback?.(
                            infos.map(v => ({
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

    const queueAll = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        retrieveVideoInfo(onPlaylistClick);
        event.stopPropagation();
    };

    const shuffleQueue = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        retrieveVideoInfo((array: VideoCardInfo[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * i);
                const temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            onPlaylistClick?.(array, info);
        });
        event.stopPropagation();
    };

    const cardContent = info && (
        <div class={style.PlaylistCard}>
            <div class={style.PlaylistCardInfo}>
                {info.thumbnailMaxRes && info.thumbnailMaxRes.url && (
                    <img class={style.PlaylistIcon} src={info.thumbnailMaxRes.url} />
                )}
                <div class={style.PlaylistInfo}>
                    <div class={["mui--text-subhead", style.textEllipsis].join(" ")}>{info.title}</div>
                    <div class={["mui--text-body1", style.textEllipsis].join(" ")}>{info.channel}</div>
                </div>
                {loading && <DotLoader />}
                <div class={style.VideoActionDiv}>
                    <Tooltip content="Queue All">
                        <Button size="small" variant="fab" onClick={queueAll}>
                            <i style={{ fontSize: "32px" }} class="material-icons">
                                play_arrow
                            </i>
                        </Button>
                    </Tooltip>
                    <Tooltip content="Shuffle and Queue All">
                        <Button size="small" variant="fab" onClick={shuffleQueue}>
                            <i style={{ fontSize: "32px" }} class="material-icons">
                                shuffle
                            </i>
                        </Button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );

    const cardVideos = (
        <div
            class={[
                style.PlaylistVideos,
                videoExpanded && videoInfo.length > 0 ? style.PlaylistVideosExpanded : ""
            ].join(" ")}
        >
            {videoExpanded &&
                videoInfo.map(vid => (
                    <VideoDisplayCard
                        key={vid.id}
                        info={vid}
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
                    style.VideoCardButton,
                    videoExpanded ? style.PlaylistButtonActive : ""
                ].join(" ")}
                variant="flat"
                onClick={videoExpanded ? hideVideos : expandVideos}
            >
                {cardContent}
            </Button>
            {cardVideos}
        </div>
    ) : (
        <div />
    );
}
