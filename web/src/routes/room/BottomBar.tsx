import { h, JSX } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { VideoInfo } from "../../utils/YoutubeTypes";
import { useGAPIContext } from "../../utils/GAPI";
import Button from "preact-mui/lib/button";
import { Modal } from "../../components/Modal";
import * as style from "./style.css";
import { YoutubeVideoInformation } from "../../utils/BackendTypes";
import { QueueModal } from "./QueueModal";
import { Video } from "../../utils/WebsocketTypes";
import { RequestVideoPreview } from "../../utils/RestCalls";
import { Tooltip } from "../../components/Popup";
import { useAbortController } from "../../components/AbortController";
import { memo } from "preact/compat";
import { VolumeSlider } from "../../components/VolumeSlider";

export interface BottomBarProps {
    currentVideo: Video | null;
    togglePlay: () => void;
    skipVideo: () => void;
    playing: boolean;
    hasVideo: boolean;
    showControls: boolean;
    allowQueuing: boolean;
    submitNewVideo: (videoID: YoutubeVideoInformation, videoTitle: string) => void;
    submitAllVideos: (newVideos: YoutubeVideoInformation[], playlistTitle: string) => void;
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
            submitNewVideo,
            submitAllVideos,
            allowQueuing,
            showControls
        } = props;
        const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

        const oldVolume = useRef<number | null>(null);

        const currentAPI = useGAPIContext();

        const controller = useAbortController();

        useEffect(() => {
            if (currentVideo !== null) {
                RequestVideoPreview(currentVideo.youtubeID, controller).then(setVideoInfo);
            }
        }, [currentVideo, controller]);

        const playingPreview = useCallback(
            (p: boolean) => {
                if (p && oldVolume.current === null && playing) {
                    oldVolume.current = playerVolume;
                    const optionA = oldVolume.current / 4;
                    const optionB = 5;
                    setPlayerVolume(optionA < optionB ? optionA : optionB);
                } else if (!p && oldVolume.current !== null) {
                    setPlayerVolume(oldVolume.current);
                    oldVolume.current = null;
                }
            },
            [playerVolume, setPlayerVolume, playing]
        );

        return (
            <div class={style.BottomBar}>
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
                    <Tooltip className={style.textEllipsis} content={videoInfo?.title ?? ""} delay={800}>
                        <div class={["mui--text-title", style.textEllipsis].join(" ")}>
                            {videoInfo?.title ?? "Nothing Currently Playing"}
                        </div>
                    </Tooltip>
                </div>
                {showControls ? (
                    <div class={style.bottomMiddleActions}>
                        <Tooltip className={style.centerTooltipChild} content="Adjust Video Volume">
                            <VolumeSlider disabled={!hasVideo} volume={playerVolume} setVolume={setPlayerVolume} />
                        </Tooltip>
                        <Tooltip
                            className={style.centerTooltipChild}
                            content={`${playing ? "Pause" : "Resume"} Room Playback`}
                        >
                            <Button disabled={!hasVideo} size="small" variant="fab" onClick={togglePlay}>
                                <i style={{ fontSize: "32px" }} class="material-icons">
                                    {playing ? "pause" : "play_arrow"}
                                </i>
                            </Button>
                        </Tooltip>
                        <Tooltip className={style.centerTooltipChild} content="Skip Current Video">
                            <Button disabled={!hasVideo} size="small" variant="fab" onClick={skipVideo}>
                                <i style={{ fontSize: "32px" }} class="material-icons">
                                    skip_next
                                </i>
                            </Button>
                        </Tooltip>
                    </div>
                ) : (
                    <div class={style.bottomMiddleActions} />
                )}
                {allowQueuing && (
                    <div class={style.bottomRightActions}>
                        <div class={style.centerTooltipChild}>
                            <Button id="openQueue" onClick={(): string => (window.location.href = "#Queue")}>
                                Queue Video
                            </Button>
                        </div>
                    </div>
                )}
                {allowQueuing && (
                    <Modal className={style.QueueContainer} idName="Queue">
                        <QueueModal
                            playingPreview={playingPreview}
                            parentController={controller}
                            currentAPI={currentAPI}
                            submitNewVideo={submitNewVideo}
                            submitAllVideos={submitAllVideos}
                            onClose={(): string => (window.location.href = "#")}
                        />
                    </Modal>
                )}
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
            prev.submitAllVideos === next.submitAllVideos &&
            prev.submitNewVideo === next.submitNewVideo &&
            prev.togglePlay === next.togglePlay &&
            prev.setPlayerVolume === next.setPlayerVolume;
        return same;
    }
);
