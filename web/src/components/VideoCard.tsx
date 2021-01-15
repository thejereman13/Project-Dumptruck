import { h, JSX } from "preact";
import * as style from "./style.css";
import { useState, useEffect, useRef } from "preact/hooks";
import Button from "preact-mui/lib/button";
import { VideoInfo, durationToString } from "../utils/YoutubeTypes";
import { RequestVideoPreview } from "../utils/RestCalls";
import { Tooltip } from "../components/Popup";
import { useAbortController } from "./AbortController";
import { memo } from "preact/compat";

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
    playingPreview?: (playing: boolean) => void;
}

export function VideoDisplayCard(props: VideoDisplayCardProps): JSX.Element {
    const { info, onClick, actionComponent, playingPreview } = props;

    const [videoPreview, setVideoPreview] = useState<boolean>(false);
    const previewRef = useRef<boolean>(false);
    const updatePreview = useRef<((playing: boolean) => void) | undefined>(undefined);
    previewRef.current = videoPreview;
    updatePreview.current = playingPreview;

    const cardClick = (): void => {
        onClick?.(info.id);
    };

    const openPreview = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        event.stopPropagation();
        setVideoPreview(!videoPreview);
        updatePreview.current?.(!videoPreview);
    };

    useEffect(() => {
        return (): void => {
            if (previewRef.current) {
                updatePreview.current?.(false);
            }
        };
    }, []);

    const cardPreview =
        actionComponent === undefined ? (
            <Tooltip content="Preview Video">
                <Button size="small" variant="fab" onClick={openPreview}>
                    <i style={{ fontSize: "24px" }} class="material-icons">
                        featured_video
                    </i>
                </Button>
            </Tooltip>
        ) : (
            actionComponent
        );

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
            <div class={style.VideoActionDiv}>{cardPreview}</div>
        </div>
    );

    return onClick ? (
        <Button
            className={["mui-btn", "mui-btn--flat", style.VideoCardButton].join(" ")}
            variant="flat"
            onClick={cardClick}
        >
            {cardContent}
            {videoPreview && (
                <div className={style.VideoPreview}>
                    <iframe
                        src={`https://www.youtube.com/embed/${info.id}?autoplay=1`}
                        height="240"
                        width="426"
                        frameBorder={0}
                        type="text/html"
                    ></iframe>
                </div>
            )}
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
const infoStoreLength = 512;

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
