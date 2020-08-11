import { h, JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import { VideoInfo } from "../../utils/YoutubeTypes";
import { RequestVideo, useGAPIContext } from "../../utils/GAPI";
import Button from "preact-mui/lib/button";
import { Modal } from "../../components/Modal";
import * as style from "./style.css";
import { YoutubeVideoInformation } from "../../utils/BackendTypes";
import { QueueModal } from "./QueueModal";

export interface BottomBarProps {
    currentVideo: string;
    togglePlay: () => void;
    playing: boolean;
    submitNewVideo: (videoID: YoutubeVideoInformation) => void;
}

export function BottomBar(props: BottomBarProps): JSX.Element {
    const { currentVideo, togglePlay, playing, submitNewVideo } = props;
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
    const [queueOpen, setQueueOpen] = useState<boolean>(false);

    const currentAPI = useGAPIContext();

    useEffect(() => {
        if (currentAPI?.isAPILoaded()) {
            RequestVideo(currentVideo, setVideoInfo);
        }
    }, [currentVideo, currentAPI]);

    return (
        <div>
            <div class={style.BottomBar}>
                <div class={style.videoInfo}>
                    {videoInfo ? <img class={style.videoIcon} src={videoInfo.thumbnailMaxRes.url} /> : <div />}
                    <div class="mui--text-title">{videoInfo?.title ?? "Nothing Currently Playing"}</div>
                </div>
                <div>
                    <Button size="small" variant="fab" onClick={togglePlay}>
                        <i style={{ fontSize: "32px" }} class="material-icons">
                            {playing ? "pause" : "play_arrow"}
                        </i>
                    </Button>
                </div>
                <div>
                    <Button id="openQueue" onClick={(): void => setQueueOpen(true)}>
                        Queue Video
                    </Button>
                </div>
            </div>
            <Modal className={style.ModalContainer} open={queueOpen} onClose={(): void => setQueueOpen(false)}>
                <QueueModal currentAPI={currentAPI} submitNewVideo={submitNewVideo} />
            </Modal>
        </div>
    );
}
