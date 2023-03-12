import { BsSkipStartFill } from "solid-icons/bs";
import { For, JSX } from "solid-js";
import { VideoCard } from "../../components/displayCards/VideoCard";
import { siteUser } from "../../Login";
import { useAbortController } from "../../utils/AbortController";
import { YoutubeVideoInformation } from "../../utils/BackendTypes";
import { RequestVideo } from "../../utils/GAPI";

import {style as commonStyle } from "./panelStyle";

export interface HistoryPanelProps {
    submitNewVideoEnd: (newVideo: YoutubeVideoInformation, videoTitle: string) => void;
    submitNewVideoFront: (newVideo: YoutubeVideoInformation, videoTitle: string) => void;
    history: string[];
}

export function HistoryPanel(props: HistoryPanelProps): JSX.Element {
    const controller = useAbortController();

    const submitFrontFromList = (videoID: string): void => {
        const user = siteUser();
        if (user?.access_token) {
            RequestVideo(videoID, user.access_token, (info) => {
                props.submitNewVideoFront(
                    {
                        videoID: info.id,
                        duration: info.duration ?? 0
                    },
                    info.title
                );
            });
        }
    };
    const submitEndFromList = (videoID: string): void => {
        const user = siteUser();
        if (user?.access_token) {
            RequestVideo(videoID, user.access_token, (info) => {
                props.submitNewVideoEnd(
                    {
                        videoID: info.id,
                        duration: info.duration ?? 0
                    },
                    info.title
                );
            });
        }
    };

    return (
        <div class={commonStyle.scrollBox}>
            <For each={props.history}>
                {
                    (vid) => {
                        const queueFront = (): void => submitFrontFromList(vid);
                        const queueEnd = (): void => submitEndFromList(vid);
                        return (
                            <VideoCard
                                videoID={vid}
                                enablePreview={true}
                                onClick={queueEnd}
                                actionComponent={
                                    <button class="btn btn-circle btn-sm btn-ghost text-primary tooltip tooltip-left inline-flex" data-tip="Queue Front">
                                        <BsSkipStartFill size="1.5rem" onClick={queueFront} />
                                    </button>
                                }
                            />
                        );
                    }
                }
            </For>
        </div>
    );
}
