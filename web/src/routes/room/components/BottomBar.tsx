import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
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
    bottomVideoInfoFull: css`
        width: 100%;
        max-width: 100%;
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
};

export interface BottomBarProps {
    currentVideo: Video | null;
    togglePlay: () => void;
    skipVideo: () => void;
    playing: boolean;
    hasVideo: boolean;
    showControls: boolean;
    allowQueuing: boolean;
    playerVolume: number;
    setPlayerVolume: (value: number) => void;
}

export const BottomBar = memo(
    function BottomBar(props: BottomBarProps): JSX.Element {
        const {
            hasVideo,
            currentVideo,
            togglePlay,
            skipVideo,
            playing,
            playerVolume,
            setPlayerVolume,
            allowQueuing,
            showControls
        } = props;
        const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

        const controller = useAbortController();

        useEffect(() => {
            if (currentVideo !== null) {
                RequestVideoPreview(currentVideo.youtubeID, controller).then(setVideoInfo);
            } else {
                setVideoInfo(null);
            }
        }, [currentVideo, controller]);

        return (
            <div class={style.bottomBar}>
                <div
                    class={
                        !allowQueuing && !showControls
                            ? [style.bottomVideoInfo, style.bottomVideoInfoFull].join(" ")
                            : style.bottomVideoInfo
                    }
                >
                    {videoInfo ? (
                        <img class={style.bottomVideoIcon} src={videoInfo?.thumbnailMaxRes?.url ?? ""} />
                    ) : (
                        <div class={style.bottomVideoIcon} />
                    )}
                    <Tooltip className={commonStyle.textEllipsis} content={videoInfo?.title ?? ""} delay={800}>
                        <div class={["mui--text-title", commonStyle.textEllipsis].join(" ")}>
                            {videoInfo?.title ?? "Nothing Currently Playing"}
                        </div>
                    </Tooltip>
                </div>
                <div class={style.bottomMiddleActions}>
                    <Tooltip className={commonStyle.centerTooltipChild} content="Adjust Video Volume">
                        <VolumeSlider disabled={!hasVideo} volume={playerVolume} setVolume={setPlayerVolume} />
                    </Tooltip>
                    {showControls ? (
                        <Tooltip
                            className={commonStyle.centerTooltipChild}
                            content={`${playing ? "Pause" : "Resume"} Room Playback`}
                        >
                            <Button disabled={!hasVideo} size="small" variant="fab" onClick={togglePlay}>
                                {playing ? <MdPause size="2rem" /> : <MdPlayArrow size="2rem" />}
                            </Button>
                        </Tooltip>
                    ) : null}
                    {showControls ? (
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
            prev.allowQueuing === next.allowQueuing &&
            prev.currentVideo === next.currentVideo &&
            prev.playing === next.playing &&
            prev.showControls === next.showControls &&
            prev.playerVolume === next.playerVolume &&
            prev.skipVideo === next.skipVideo &&
            prev.togglePlay === next.togglePlay &&
            prev.setPlayerVolume === next.setPlayerVolume;
        return same;
    }
);
