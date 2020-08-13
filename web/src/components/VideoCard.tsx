import { h, JSX } from "preact";

import * as style from "./style.css";
import { useState, useEffect } from "preact/hooks";
import { useGAPIContext, RequestVideosFromPlaylist } from "../utils/GAPI";
import Button from "preact-mui/lib/button";
import { VideoInfo, PlaylistInfo } from "../utils/YoutubeTypes";
import { RequestVideoPreview } from "../utils/RestCalls";

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
    videoID: string;
    onClick?: (id: string) => void;
}

export function VideoCard(props: VideoCardProps): JSX.Element {
    const { videoID, onClick } = props;
    const [videoInfo, setVideoInfo] = useState<VideoCardInfo | null>(null);

    useEffect(() => {
        if (videoID) {
            RequestVideoPreview(videoID).then((info: VideoInfo | null) => {
                if (info)
                    setVideoInfo({
                        id: info.id,
                        title: info.title,
                        channel: info.channel,
                        thumbnailURL: info.thumbnailMaxRes.url
                    });
            });
        }
    }, [videoID]);

    return videoInfo ? <VideoDisplayCard info={videoInfo} onClick={onClick} /> : <div />;
}

export interface PlaylistCardProps {
    info: PlaylistInfo;
    onVideoClick?: (id: string) => void;
}

export function PlaylistCard(props: PlaylistCardProps): JSX.Element {
    const { info, onVideoClick } = props;
    const [videoInfo, setVideoInfo] = useState<VideoCardInfo[]>([]);
    const [videoExpanded, setVideoExpanded] = useState<boolean>(false);

    const GAPIContext = useGAPIContext();

    const expandVideos = (): void => setVideoExpanded(true);
    const hideVideos = (): void => setVideoExpanded(false);

    useEffect(() => {
        if (GAPIContext?.isAPILoaded() && info.id && videoExpanded && videoInfo.length === 0) {
            RequestVideosFromPlaylist(info.id, (infos: VideoInfo[]) => {
                setVideoInfo(
                    infos.map(v => ({
                        id: v.id,
                        title: v.title,
                        channel: v.channel,
                        thumbnailURL: v.thumbnailMaxRes?.url ?? ""
                    }))
                );
            });
        }
    }, [GAPIContext, info.id, videoExpanded, videoInfo]);

    const queueAll = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        if (!info.id) return;
        if (!videoExpanded && videoInfo.length === 0 && GAPIContext?.isAPILoaded()) {
            RequestVideosFromPlaylist(info.id, (infos: VideoInfo[]) => {
                infos.forEach(v => onVideoClick?.(v.id));
            });
        } else {
            videoInfo.forEach(v => onVideoClick?.(v.id));
        }
        event.stopPropagation();
    };

    const cardContent = info && (
        <div class={style.PlaylistCard}>
            <div class={style.PlaylistCardInfo}>
                {info.thumbnailMaxRes && info.thumbnailMaxRes.url && (
                    <img class={style.PlaylistIcon} src={info.thumbnailMaxRes.url} />
                )}
                <div class={style.PlaylistInfo}>
                    <div class="mui--text-subhead">{info.title}</div>
                    <div class="mui--text-body1">{info.channel}</div>
                </div>
                <div>
                    <Button size="small" variant="fab" onClick={queueAll}>
                        <i style={{ fontSize: "32px" }} class="material-icons">
                            play_arrow
                        </i>
                    </Button>
                </div>
            </div>
        </div>
    );

    const cardVideos = (
        <div
            class={[
                style.PlaylistVideos,
                videoExpanded && videoInfo.length > 0 ? style.PlaylistVideosExpanded : ""
            ].join(" ")}
        >
            {videoExpanded &&
                videoInfo.map(vid => (
                    <VideoDisplayCard
                        key={vid.id}
                        info={vid}
                        onClick={onVideoClick ? (): void => onVideoClick(vid.id) : undefined}
                    />
                ))}
        </div>
    );

    return videoInfo ? (
        <div>
            <Button
                className={["mui-btn", "mui-btn--flat", style.VideoCardButton].join(" ")}
                variant="flat"
                onClick={videoExpanded ? hideVideos : expandVideos}
            >
                {cardContent}
            </Button>
            {cardVideos}
        </div>
    ) : (
        <div />
    );
}
