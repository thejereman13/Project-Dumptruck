import { h, JSX } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
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

export interface BottomBarProps {
    currentVideo: Video | null;
    togglePlay: () => void;
    skipVideo: () => void;
    playing: boolean;
    showControls: boolean;
    allowQueuing: boolean;
    submitNewVideo: (videoID: YoutubeVideoInformation, videoTitle: string) => void;
    submitAllVideos: (newVideos: YoutubeVideoInformation[], playlistTitle: string) => void;
}

export const BottomBar = memo(
    function BottomBar(props: BottomBarProps): JSX.Element {
        const {
            currentVideo,
            togglePlay,
            skipVideo,
            playing,
            submitNewVideo,
            submitAllVideos,
            allowQueuing,
            showControls
        } = props;
        const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
        const [queueOpen, setQueueOpen] = useState<boolean>(false);

        const currentAPI = useGAPIContext();

        const controller = useAbortController();

        useEffect(() => {
            if (currentVideo !== null) {
                RequestVideoPreview(currentVideo.youtubeID, controller).then(setVideoInfo);
            }
        }, [currentVideo, controller]);

        const closeModal = useCallback((): void => setQueueOpen(false), []);

        console.log("Queue Modal Open: ", queueOpen);

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
                    <div class={["mui--text-title", style.textEllipsis].join(" ")}>
                        {videoInfo?.title ?? "Nothing Currently Playing"}
                    </div>
                </div>
                {showControls ? (
                    <div class={style.bottomMiddleActions}>
                        <Tooltip className={style.centerTooltipChild} content="Pause Room Playback">
                            <Button size="small" variant="fab" onClick={togglePlay}>
                                <i style={{ fontSize: "32px" }} class="material-icons">
                                    {playing ? "pause" : "play_arrow"}
                                </i>
                            </Button>
                        </Tooltip>
                        <Tooltip className={style.centerTooltipChild} content="Skip Current Video">
                            <Button size="small" variant="fab" onClick={skipVideo}>
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
                            <Button id="openQueue" onClick={(): void => setQueueOpen(true)}>
                                Queue Video
                            </Button>
                        </div>
                    </div>
                )}
                <Modal className={style.QueueContainer} open={queueOpen} onClose={closeModal}>
                    <QueueModal
                        parentController={controller}
                        currentAPI={currentAPI}
                        submitNewVideo={submitNewVideo}
                        submitAllVideos={submitAllVideos}
                        onClose={closeModal}
                    />
                </Modal>
            </div>
        );
    },
    (prev: BottomBarProps, next: BottomBarProps) => {
        const same =
            prev.allowQueuing === next.allowQueuing &&
            prev.currentVideo === next.currentVideo &&
            prev.playing === next.playing &&
            prev.showControls === next.showControls &&
            prev.skipVideo === next.skipVideo &&
            prev.submitAllVideos === next.submitAllVideos &&
            prev.submitNewVideo === next.submitNewVideo &&
            prev.togglePlay === next.togglePlay;
        return same;
    }
);
