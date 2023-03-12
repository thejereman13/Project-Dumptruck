import { createEffect, createSignal, JSX, onCleanup, Show } from "solid-js";
import { VideoInfo, durationToString } from "../../utils/YoutubeTypes";
import { RequestVideoPreview } from "../../utils/RestCalls";

import { IoEye, IoEyeOff } from "solid-icons/io";

import { style as commonStyle } from "../sharedStyle";
import { NotifyChannel } from "../../utils/EventSubscriber";
import { videoInfoCache } from "../../utils/GAPI";
import { css } from "solid-styled-components";
import { useAbortController } from "../../utils/AbortController";

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
    const [videoPreview, setVideoPreview] = createSignal(false);

    const cardClick = () => {
        props.onClick?.(props.info.id);
        if (props.enablePreview) {
            setVideoPreview(false);
            NotifyChannel("preview", false);
        }
    };

    const openPreview: JSX.EventHandler<HTMLDivElement, MouseEvent> = (event) => {
        event.stopPropagation();
        setVideoPreview(!videoPreview());
        NotifyChannel("preview", videoPreview());
    };

    onCleanup(() => {
        if (props.enablePreview) NotifyChannel("preview", false);
    });

    const cardContent = (
        <div class={style.videoCard}>
            {props.info.thumbnailURL && (
                <div class={style.videoIcon}>
                    <Show when={props.enablePreview}>
                        <div
                            class={videoIconPreviewStyle}
                            onClick={openPreview}
                        >
                            <Show when={videoPreview()} fallback={<IoEye size="3rem" />}>
                                <IoEyeOff size="3rem" />
                            </Show>
                        </div>
                    </Show>
                    <img src={props.info.thumbnailURL.replace("hqdefault", "mqdefault")} />
                    <div class={["text-base", videoDurationStyle].join(" ")}>
                        {durationToString(props.info.duration)}
                    </div>
                </div>
            )}
            <div class={style.videoInfo}>
                <Show
                    when={props.onClick}
                    fallback={
                        <span class="tooltip" data-tip={props.info.title}>
                            <div class={`text-base normal-case font-medium ${commonStyle.textEllipsis}`}>{props.info.title}</div>
                        </span>
                    }
                >
                    <div>
                        <div class={`text-base normal-case font-medium ${commonStyle.textEllipsis}`}>{props.info.title}</div>
                    </div>
                </Show>
                <div class={`text-sm normal-case font-medium ${commonStyle.textEllipsis}`}>
                    {props.info.channel?.length > 0 ? props.info.channel : ". . ."}
                </div>
            </div>
            <div class={commonStyle.videoActionDiv}>{props.actionComponent}</div>
        </div>
    );

    return (
        <Show when={props.onClick} fallback={<div>{cardContent}</div>}>
            <button class={`btn btn-ghost no-animation ${style.videoCardButton}`} onClick={cardClick}>
                {cardContent}
                <div class={[style.videoPreview, videoPreview() ? style.videoPreviewOpen : ""].join(" ")}>
                    <Show when={videoPreview()}>
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${props.info.id}?autoplay=1`}
                            height="240"
                            width="426"
                        ></iframe>
                    </Show>
                </div>
            </button>
        </Show>
    );
}

export interface VideoCardProps {
    videoID: string;
    duration?: number;
    onClick?: (id: string) => void;
    actionComponent?: JSX.Element;
    enablePreview: boolean;
}

export function VideoCard(props: VideoCardProps): JSX.Element {
    const [videoInfo, setVideoInfo] = createSignal<VideoCardInfo | null>(null);

    const controller = useAbortController();

    createEffect(() => {
        if (props.videoID) {
            const existingInfo = videoInfoCache.queryInfoStore(props.videoID);
            if (existingInfo) {
                setVideoInfo({ ...existingInfo, duration: props.duration });
            } else {
                RequestVideoPreview(controller, props.videoID).then((info: VideoInfo | null) => {
                    if (info) {
                        setVideoInfo(
                            videoInfoCache.pushInfoStore({
                                id: info.id,
                                title: info.title,
                                channel: info.channel,
                                duration: props.duration,
                                thumbnailURL: info.thumbnailMaxRes.url,
                            })
                        );
                    }
                });
            }
        }
    });

    return (
        <Show when={videoInfo()} fallback={<div />}>
            <VideoDisplayCard
                info={videoInfo()!}
                onClick={props.onClick}
                actionComponent={props.actionComponent}
                enablePreview={props.enablePreview}
            />
        </Show>
    );
}
