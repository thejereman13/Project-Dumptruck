import { h, JSX } from "preact";
import { useState, useEffect } from "preact/hooks";
import Button from "preact-mui/lib/button";
import { VideoInfo, durationToString } from "../../utils/YoutubeTypes";
import { RequestVideoPreview } from "../../utils/RestCalls";
import { Tooltip } from "../Popup";
import { useAbortController } from "../../utils/AbortController";
import { memo } from "preact/compat";

import MdEye from "@meronex/icons/ios/MdEye";
import MdEyeOff from "@meronex/icons/ios/MdEyeOff";

import { style as commonStyle } from "../sharedStyle";
import { NotifyChannel } from "../../utils/EventSubscriber";
import { videoInfoCache } from "../../utils/GAPI";
import { css } from "@linaria/core";

export const videoIconPreviewStyle = css`
    opacity: var(--iconPreviewOpacity, 0);
    position: absolute;
    color: var(--text-secondary);
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 8;
    & svg {
        filter: drop-shadow(4px 4px 0.5rem black);
    }
`;
export const videoDurationStyle = css`
    font-weight: 500;
    position: absolute;
    top: 0;
    left: 0;
    background: var(--dp2-surface);
    padding: 0 0.4rem;
    border-radius: 0 0 0.25rem 0;
    display: var(--durationDisplay, none);
    z-index: 2;
`;

export const style = {
    videoCard: css`
        display: flex;
        padding: 0.5rem;
        height: 5rem;
        width: 100%;
        position: relative;
        &:hover {
            --durationDisplay: block;
        }
    `,
    videoIcon: css`
        height: 100%;
        display: inline-block;
        position: relative;
        z-index: 1;
        &:hover {
            --iconPreviewOpacity: 1;
        }
        & > img {
            height: 100%;
        }
    `,
    
    videoInfo: css`
        height: 100%;
        display: inline-flex;
        flex-direction: column;
        padding-left: 1rem;
        text-align: start;
        overflow: hidden;
    `,
    videoCardButton: css`
        display: flex;
        height: unset;
        padding: 0 1rem;
        width: 100%;
        margin: 0 !important;
        flex-flow: column;
        &:hover {
            --durationDisplay: block;
        }
    `,
    videoPreview: css`
        z-index: 64;
        padding-left: 2rem;
        height: 0;
        transition: height 0.5s;
    `,
    videoPreviewOpen: css`
        height: 256px;
    `,
};

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
                            className={videoIconPreviewStyle}
                            onClick={openPreview}
                            delay={800}
                        >
                            {videoPreview ? <MdEyeOff size="3rem" /> : <MdEye size="3rem" />}
                        </Tooltip>
                    ) : null}
                    <img src={info.thumbnailURL.replace("hqdefault", "mqdefault")} />
                    <div class={["mui--text-body1", videoDurationStyle].join(" ")}>
                        {durationToString(info.duration)}
                    </div>
                </div>
            )}
            <div class={style.videoInfo}>
                {onClick? (
                    <div>
                        <div class={["mui--text-subhead", commonStyle.textEllipsis].join(" ")}>{info.title}</div>
                    </div>
                ) : (
                    <Tooltip content={info.title} delay={800}>
                        <div class={["mui--text-subhead", commonStyle.textEllipsis].join(" ")}>{info.title}</div>
                    </Tooltip>
                )}
                <div class={["mui--text-body1", commonStyle.textEllipsis].join(" ")}>
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
                        src={`https://www.youtube-nocookie.com/embed/${info.id}?autoplay=1`}
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

export const VideoCard = memo(
    function VideoCard(props: VideoCardProps): JSX.Element {
        const { videoID, duration, onClick, actionComponent, enablePreview } = props;
        const [videoInfo, setVideoInfo] = useState<VideoCardInfo | null>(null);

        const controller = useAbortController();

        useEffect(() => {
            if (videoID) {
                const existingInfo = videoInfoCache.queryInfoStore(videoID);
                if (existingInfo) {
                    setVideoInfo({ ...existingInfo, duration });
                } else {
                    RequestVideoPreview(videoID, controller).then((info: VideoInfo | null) => {
                        if (info) {
                            setVideoInfo(
                                videoInfoCache.pushInfoStore({
                                    id: info.id,
                                    title: info.title,
                                    channel: info.channel,
                                    duration: duration,
                                    thumbnailURL: info.thumbnailMaxRes.url
                                })
                            );
                        }
                    });
                }
            }
        }, [videoID, duration, controller]);

        return videoInfo ? (
            <VideoDisplayCard
                info={videoInfo}
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
