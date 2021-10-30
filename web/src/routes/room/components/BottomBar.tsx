import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { VideoInfo } from "../../../utils/YoutubeTypes";
import Button from "preact-mui/lib/button";
import {style as commonStyle } from "../../../components/sharedStyle";
import { Video } from "../../../utils/WebsocketTypes";
import { RequestVideoPreview } from "../../../utils/RestCalls";
import { Tooltip } from "../../../components/Popup";
import { useAbortController } from "../../../utils/AbortController";
import { memo } from "preact/compat";
import { VolumeSlider } from "../../../components/VolumeSlider";

import MdPause from "@meronex/icons/md/MdPause";
import MdPlayArrow from "@meronex/icons/md/MdPlayArrow";
import MdSkipNext from "@meronex/icons/md/MdSkipNext";
import { css } from "@linaria/core";
import { RoomUser } from "../../../utils/BackendTypes";

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

export const BottomBar = memo(
    function BottomBar(props: BottomBarProps): JSX.Element {
        const {
            hasVideo,
            currentVideo,
            userList,
            togglePlay,
            skipVideo,
            playing,
            playerVolume,
            setPlayerVolume,
            canPause,
            canSkip,
        } = props;
        const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
        const [queuedName, setQueuedName] = useState(currentVideo ? getUserName(userList, currentVideo) : undefined);

        const controller = useAbortController();

        useEffect(() => {
            if (currentVideo !== null) {
                RequestVideoPreview(currentVideo.youtubeID, controller).then(setVideoInfo);
            } else {
                setVideoInfo(null);
            }
        }, [currentVideo, controller]);
        const oldVid = useRef<Video | null>(null);
        useEffect(() => {
            if (queuedName === undefined || oldVid.current !== currentVideo) {
                if (currentVideo !== null) {
                    const n = getUserName(userList, currentVideo);
                    if (n)
                        setQueuedName(n);
                } else {
                    setQueuedName(undefined);
                }
            }
            oldVid.current = currentVideo;
        }, [userList, currentVideo]);

        return (
            <div class={style.bottomBar}>
                <div class={style.bottomVideoInfo}>
                    {videoInfo ? (
                        <img class={style.bottomVideoIcon} src={videoInfo?.thumbnailMaxRes?.url ?? ""} />
                    ) : (
                        <div class={style.bottomVideoIcon} />
                    )}
                    <div class={style.titleContainer}>
                        <Tooltip className={commonStyle.textEllipsis} content={videoInfo?.title ?? ""} delay={700}>
                            <div class={["mui--text-title", commonStyle.textEllipsis].join(" ")}>
                                {videoInfo?.title ?? "Nothing Currently Playing"}
                            </div>
                        </Tooltip>
                        <Tooltip className={commonStyle.textEllipsis} content={(videoInfo?.channel?? "") + (queuedName ? ` | Queued By: ${queuedName}` : "")} delay={700}>
                        <div class={["mui--text-subhead", commonStyle.textEllipsis].join(" ")}>
                            {videoInfo?.channel ?? ""}
                            {queuedName ? (
                                <span class={videoInfo?.channel ? style.creditSeparator : undefined}>Queued By: {queuedName}</span>
                            ) : null}
                        </div>
                        </Tooltip>
                    </div>
                </div>
                <div class={style.bottomMiddleActions}>
                    <Tooltip className={commonStyle.centerTooltipChild} content="Adjust Video Volume">
                        <VolumeSlider disabled={!hasVideo} volume={playerVolume} setVolume={setPlayerVolume} />
                    </Tooltip>
                    {canPause ? (
                        <Tooltip
                            className={commonStyle.centerTooltipChild}
                            content={`${playing ? "Pause" : "Resume"} Room Playback`}
                        >
                            <Button disabled={!hasVideo} size="small" variant="fab" onClick={togglePlay}>
                                {playing ? <MdPause size="2rem" /> : <MdPlayArrow size="2rem" />}
                            </Button>
                        </Tooltip>
                    ) : null}
                    {canSkip ? (
                        <Tooltip className={commonStyle.centerTooltipChild} content="Skip Current Video">
                            <Button disabled={!hasVideo} size="small" variant="fab" onClick={skipVideo}>
                                <MdSkipNext size="2rem" />
                            </Button>
                        </Tooltip>
                    ) : null}
                </div>
            </div>
        );
    },
    (prev: BottomBarProps, next: BottomBarProps) => {
        const same =
            prev.hasVideo === next.hasVideo &&
            prev.canPause === next.canPause &&
            prev.currentVideo === next.currentVideo &&
            prev.playing === next.playing &&
            prev.canSkip === next.canSkip &&
            prev.playerVolume === next.playerVolume &&
            prev.skipVideo === next.skipVideo &&
            prev.togglePlay === next.togglePlay &&
            prev.setPlayerVolume === next.setPlayerVolume;
        return same;
    }
);
