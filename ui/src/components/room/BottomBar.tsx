import { IoPause, IoPlay, IoPlaySkipForward } from "solid-icons/io";
import { createEffect, createSignal, JSX, Show } from "solid-js";
import { css } from "solid-styled-components";
import { useAbortController } from "../../utils/AbortController";
import { RoomUser } from "../../utils/BackendTypes";
import { RequestVideoPreview } from "../../utils/RestCalls";
import { Video } from "../../utils/WebsocketTypes";
import { VideoInfo } from "../../utils/YoutubeTypes";

import { style as commonStyle } from "../sharedStyle";
import { VolumeSlider } from "./VolumeSlider";

const style = {
    bottomBar: css`
        display: flex;
        justify-content: space-between;
        flex-direction: row;
        width: 100%;
        background-color: var(--dp2-surface);
        height: 5rem;
        min-height: 5rem;
        max-height: 5rem;
    `,
    bottomVideoInfo: css`
        display: flex;
        flex-direction: row;
        padding: 0.5rem;
        padding-right: 8rem;
        width: 50%;
        max-width: 50%;
    `,
    bottomVideoIcon: css`
        max-height: 4rem;
        padding-right: 1rem;
    `,
    bottomMiddleActions: css`
        width: 16rem;
        position: absolute;
        left: 50%;
        right: 50%;
        height: 5rem;
        transform: translate3d(-50%, 0, 0);
        display: flex;
        justify-content: space-evenly;
    `,
    bottomRightActions: css`
        display: flex;
        align-content: center;
        justify-content: flex-end;
        padding-left: 8rem;
        width: 50%;
        max-width: 50%;
    `,
    bottomQueueButton: css`
        height: 3rem;
        border-radius: 0.5rem;
        padding: 0.5rem;
        display: inline-flex;
        background-color: var(--theme-primary-dark);
        & p {
            line-height: 2rem;
            padding: 0 0.5rem;
            font-size: 1rem;
        }
    `,
    titleContainer: css`
        overflow: hidden;
    `,
    creditSeparator: css`
        border-left: 2px solid;
        margin-left: 1rem;
        padding-left: 1rem;
    `,
};

export interface BottomBarProps {
    currentVideo: Video | null;
    userList: RoomUser[];
    togglePlay: () => void;
    skipVideo: () => void;
    playing: boolean;
    hasVideo: boolean;
    canPause: boolean;
    canSkip: boolean;
    playerVolume: number;
    setPlayerVolume: (value: number) => void;
}

function getUserName(userList: RoomUser[], currentVideo: Video) {
    return userList.find((u) => u.clientID === currentVideo.queuedBy)?.name;
}

export function BottomBar(props: BottomBarProps): JSX.Element {
    const [videoInfo, setVideoInfo] = createSignal<VideoInfo | null>(null);
    const [queuedName, setQueuedName] = createSignal(props.currentVideo ? getUserName(props.userList, props.currentVideo) : undefined);

    const controller = useAbortController();

    createEffect(() => {
        if (props.currentVideo !== null) {
            RequestVideoPreview(controller, props.currentVideo.youtubeID).then(setVideoInfo);
        } else {
            setVideoInfo(null);
        }
    });

    let oldVid: Video | null = null;
    createEffect(() => {
        if (queuedName === undefined || oldVid !== props.currentVideo) {
            if (props.currentVideo !== null) {
                const n = getUserName(props.userList, props.currentVideo);
                if (n)
                    setQueuedName(n);
            } else {
                setQueuedName(undefined);
            }
        }
        oldVid = props.currentVideo;
    });

    return (
        <div class={style.bottomBar}>
            <div class={style.bottomVideoInfo}>
                <Show when={videoInfo()} fallback={<div class={style.bottomVideoIcon} />}>
                    <img class={style.bottomVideoIcon} src={videoInfo()?.thumbnailMaxRes?.url ?? ""} />
                </Show>
                <div class="flex flex-col overflow-hidden">
                    <div class={`${commonStyle.textEllipsis} tooltip`} data-tip={videoInfo()?.title ?? ""}>
                        <div class={`text-lg text-left font-semibold ${commonStyle.textEllipsis}`}>
                            {videoInfo()?.title ?? "Nothing Currently Playing"}
                        </div>
                    </div>
                    <div class={`${commonStyle.textEllipsis} tooltip`} data-ip={(videoInfo()?.channel?? "") + (queuedName ? ` | Queued By: ${queuedName}` : "")}>
                        <div class={`${commonStyle.textEllipsis} text-base text-left`}>
                            {videoInfo()?.channel ?? ""}
                            {queuedName ? (
                                <span class={videoInfo()?.channel ? style.creditSeparator : undefined}>Queued By: {queuedName}</span>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
            <div class={style.bottomMiddleActions}>
                <div class="inline-flex items-center">
                    <VolumeSlider disabled={!props.hasVideo} volume={props.playerVolume} setVolume={props.setPlayerVolume} />
                </div>
                <Show when={props.canPause}>
                    <div
                        class={`${commonStyle.centerTooltipChild} tooltip`}
                        data-tip={`${props.playing ? "Pause" : "Resume"} Room Playback`}
                    >
                        <button class="btn btn-circle btn-primary" disabled={!props.hasVideo} onClick={props.togglePlay}>
                            {props.playing ? <IoPause size="2rem" /> : <IoPlay size="2rem" />}
                        </button>
                    </div>
                </Show>
                <Show when={props.canSkip}>
                    <div class={`${commonStyle.centerTooltipChild} tooltip`} data-tip="Skip Current Video">
                        <button class="btn btn-circle btn-primary" disabled={!props.hasVideo} onClick={props.skipVideo}>
                            <IoPlaySkipForward size="2rem" />
                        </button>
                    </div>
                </Show>
            </div>
        </div>
    );
}
