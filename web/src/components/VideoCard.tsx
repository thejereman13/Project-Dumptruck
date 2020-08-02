import { h, JSX } from "preact";

import * as style from "./style.css";
import { useState, useEffect } from "preact/hooks";
import { useGAPIContext, RequestVideo, RequestPlaylist } from "../utils/GAPI";
import Button from "preact-mui/lib/button";
import { VideoInfo, PlaylistInfo } from "../utils/YoutubeTypes";

interface VideoCardInfo {
    id: string;
    title: string;
    channel: string;
    thumbnailURL: string;
    items?: number;
}

export interface VideoDisplayCardProps {
    info: VideoCardInfo;
    onClick?: (id: string) => void;
}

export function VideoDisplayCard(props: VideoDisplayCardProps): JSX.Element {
    const { info, onClick } = props;
    const cardClick = (): void => {
        onClick?.(info.id);
    };

    const cardContent = (
        <div class={style.VideoCard}>
            {info.thumbnailURL && <img class={style.VideoIcon} src={info.thumbnailURL} />}
            <div class={style.VideoInfo}>
                <div class="mui--text-subhead">{info.title}</div>
                <div class="mui--text-body1">{info.channel}</div>
            </div>
        </div>
    );

    return onClick ? (
        <Button
            className={["mui-btn", "mui-btn--flat", style.VideoCardButton].join(" ")}
            variant="flat"
            onClick={cardClick}
        >
            {cardContent}
        </Button>
    ) : (
        <div>{cardContent}</div>
    );
}

export interface VideoCardProps {
    videoID?: string;
    playlistID?: string;
    onClick?: (id: string) => void;
}

export function VideoCard(props: VideoCardProps): JSX.Element {
    const { videoID, playlistID, onClick } = props;
    const [videoInfo, setVideoInfo] = useState<VideoCardInfo | null>(null);

    const GAPIContext = useGAPIContext();

    useEffect(() => {
        if (GAPIContext?.isAPILoaded) {
            if (videoID) {
                RequestVideo(videoID, (info: VideoInfo) => {
                    setVideoInfo({
                        id: info.id,
                        title: info.title,
                        channel: info.channel,
                        thumbnailURL: info.thumbnailMaxRes.url
                    });
                });
            } else if (playlistID) {
                RequestPlaylist(playlistID, (info: PlaylistInfo) => {
                    setVideoInfo({
                        id: info.id,
                        title: info.title,
                        channel: info.channel,
                        items: info.videoCount,
                        thumbnailURL: info.thumbnailMaxRes.url
                    });
                });
            }
        }
    }, [GAPIContext, videoID, playlistID]);

    return videoInfo ? <VideoDisplayCard info={videoInfo} onClick={onClick} /> : <div />;
}
