import { h, JSX } from "preact";
import * as style from "./style.css";
import { useState, useEffect, Ref } from "preact/hooks";
import { useGAPIContext, RequestVideosFromPlaylist, RequestLikedVideos } from "../utils/GAPI";
import Button from "preact-mui/lib/button";
import { VideoInfo, PlaylistInfo } from "../utils/YoutubeTypes";
import { Tooltip } from "../components/Popup";
import { useAbortController } from "./AbortController";
import { RegisterLoadingNotification } from "./Notification";
import { DotLoader } from "./LoadingAnimations";
import { VideoCardInfo, VideoDisplayCard } from "./VideoCard";

export interface PlaylistCardProps {
    info: PlaylistInfo;
    onVideoClick?: (id: VideoCardInfo) => void;
    onPlaylistClick?: (vids: VideoCardInfo[], info: PlaylistInfo) => void;
    parentController: Ref<AbortController>;
    playingPreview: (playing: boolean) => void;
}

export function PlaylistCard(props: PlaylistCardProps): JSX.Element {
    const { info, onVideoClick, onPlaylistClick, parentController, playingPreview } = props;
    const [videoInfo, setVideoInfo] = useState<VideoCardInfo[]>([]);
    const [videoExpanded, setVideoExpanded] = useState<boolean>(false);
    const [durationsLoaded, setDurationsLoaded] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const GAPIContext = useGAPIContext();

    const controller = useAbortController();

    const expandVideos = (): void => setVideoExpanded(true);
    const hideVideos = (): void => setVideoExpanded(false);

    // Close the card when the location changes (modal closes)
    // useEffect(() => {
    //     setVideoExpanded(false);
    // }, [window.location.href]); // eslint-disable-line react-hooks/exhaustive-deps

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
                        playingPreview={playingPreview}
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
