import { h, JSX } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import Button from "preact-mui/lib/button";
import { VideoInfo, durationToString } from "../../utils/YoutubeTypes";
import { RequestVideoPreview } from "../../utils/RestCalls";
import { Tooltip } from "../Popup";
import { useAbortController } from "../../utils/AbortController";
import { memo } from "preact/compat";

import { IoMdEye, IoMdEyeOff } from "react-icons/io";

import * as style from "./VideoCard.css";
import * as commonStyle from "./DisplayCard.css";
import { NotifyChannel } from "../../utils/EventSubscriber";

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
    enablePreview: boolean;
}

export function VideoDisplayCard(props: VideoDisplayCardProps): JSX.Element {
    const { info, onClick, actionComponent, enablePreview } = props;

    const [videoPreview, setVideoPreview] = useState<boolean>(false);

    const cardClick = (): void => {
        onClick?.(info.id);
        if (enablePreview) {
            setVideoPreview(false);
            NotifyChannel("preview", false);
        }
    };

    const openPreview = (event: JSX.TargetedMouseEvent<HTMLDivElement> | React.MouseEvent): void => {
        event.stopPropagation();
        setVideoPreview(!videoPreview);
        NotifyChannel("preview", !videoPreview);
    };

    useEffect(() => {
        return (): void => {
            if (enablePreview) NotifyChannel("preview", false);
        };
    }, [enablePreview]);

    const cardContent = (
        <div class={style.videoCard}>
            {info.thumbnailURL && (
                <div class={style.videoIcon}>
                    {enablePreview ? (
                        <Tooltip
                            content="Preview Video"
                            className={style.videoIconPreview}
                            onClick={openPreview}
                            delay={800}
                        >
                            {videoPreview ? <IoMdEyeOff size="3rem" /> : <IoMdEye size="3rem" />}
                        </Tooltip>
                    ) : null}
                    <img src={info.thumbnailURL.replace("hqdefault", "mqdefault")} />
                    <div class={["mui--text-body1", style.videoDuration].join(" ")}>
                        {durationToString(info.duration)}
                    </div>
                </div>
            )}
            <div class={style.videoInfo}>
                <Tooltip content={info.title} delay={800}>
                    <div class={["mui--text-subhead", style.textEllipsis].join(" ")}>{info.title}</div>
                </Tooltip>
                <div class={["mui--text-body1", style.textEllipsis].join(" ")}>
                    {info.channel?.length > 0 ? info.channel : ". . ."}
                </div>
            </div>
            <div class={commonStyle.videoActionDiv}>{actionComponent}</div>
        </div>
    );

    return onClick ? (
        <Button
            className={["mui-btn", "mui-btn--flat", style.videoCardButton].join(" ")}
            variant="flat"
            onClick={cardClick}
        >
            {cardContent}
            <div className={[style.videoPreview, videoPreview ? style.videoPreviewOpen : ""].join(" ")}>
                {videoPreview ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${info.id}?autoplay=1`}
                        height="240"
                        width="426"
                        frameBorder={0}
                        type="text/html"
                    ></iframe>
                ) : null}
            </div>
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
    enablePreview: boolean;
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
        const { videoID, duration, onClick, actionComponent, enablePreview } = props;
        const [videoInfo, setVideoInfo] = useState<VideoCardInfo | null>(null);

        const controller = useAbortController();

        const vidID = useRef<VideoInfo>(null);

        useEffect(() => {
            if (videoID) {
                const ind = infoStore.findIndex((inf) => inf.id === videoID);
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

        const workingInfo = infoStore.find((inf) => inf.id === videoID) ?? videoInfo;
        return workingInfo ? (
            <VideoDisplayCard
                info={workingInfo}
                onClick={onClick}
                actionComponent={actionComponent}
                enablePreview={enablePreview}
            />
        ) : (
            <div />
        );
    },
    (prev: VideoCardProps, next: VideoCardProps) => {
        const same = prev.videoID === next.videoID;
        return same;
    }
);
