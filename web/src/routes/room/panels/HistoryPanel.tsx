import { h, JSX } from "preact";
import { memo } from "preact/compat";
import { VideoQueueMenu } from "../../../components/displayCards/QueueMenu";
import { VideoCard } from "../../../components/displayCards/VideoCard";
import { useAbortController } from "../../../utils/AbortController";
import { YoutubeVideoInformation } from "../../../utils/BackendTypes";
import { RequestVideo } from "../../../utils/GAPI";

import {style as commonStyle } from "./panelStyle";

export interface HistoryPanelProps {
    submitNewVideoEnd: (newVideo: YoutubeVideoInformation, videoTitle: string) => void;
    submitNewVideoFront: (newVideo: YoutubeVideoInformation, videoTitle: string) => void;
    history: string[];
}

export const HistoryPanel = memo(function HistoryPanel(props: HistoryPanelProps): JSX.Element {
    const { history, submitNewVideoEnd, submitNewVideoFront } = props;

    const controller = useAbortController();

    const submitFrontFromList = (videoID: string): void => {
        RequestVideo(videoID, controller, (info) => {
            submitNewVideoFront(
                {
                    videoID: info.id,
                    duration: info.duration ?? 0
                },
                info.title
            );
        });
    };
    const submitEndFromList = (videoID: string): void => {
        RequestVideo(videoID, controller, (info) => {
            submitNewVideoEnd(
                {
                    videoID: info.id,
                    duration: info.duration ?? 0
                },
                info.title
            );
        });
    };

    return (
        <div class={commonStyle.scrollBox}>
            {history.map((vid, i) => {
                const queueFront = (): void => submitFrontFromList(vid);
                const queueEnd = (): void => submitEndFromList(vid);
                return (
                    <VideoCard
                        key={vid + i}
                        videoID={vid}
                        enablePreview={true}
                        onClick={queueEnd}
                        actionComponent={<VideoQueueMenu queueFront={queueFront} queueEnd={queueEnd} />}
                    />
                );
            })}
        </div>
    );
});
