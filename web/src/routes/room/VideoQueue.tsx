import { h, JSX } from "preact";
import { PlaylistByUser, Video } from "../../utils/WebsocketTypes";
import { RoomUser } from "../../utils/BackendTypes";
import Button from "preact-mui/lib/button";
import { VideoCard, VideoCardInfo } from "../../components/VideoCard";
import * as style from "./VideoQueue.css";
import * as commonStyle from "./style.css";
import { useState, useEffect } from "preact/hooks";
import { RequestVideoPreview } from "../../utils/RestCalls";
import { durationToString, VideoInfo } from "../../utils/YoutubeTypes";
import { Tooltip } from "../../components/Popup";
import { useAbortController } from "../../components/AbortController";
import { memo } from "preact/compat";

export interface UserQueueCardProps {
    allowRemoval: boolean;
    user: RoomUser;
    playlist: Video[];
    removeVideo: (id: string) => void;
    openEdit: (id: string) => void;
}

export function UserQueueCard(props: UserQueueCardProps): JSX.Element {
    const { playlist, user, removeVideo, openEdit, allowRemoval } = props;
    const [videoInfo, setVideoInfo] = useState<VideoCardInfo | null>(null);
    const [videoExpanded, setVideoExpanded] = useState<boolean>(false);

    const expandVideos = (): void => {
        if (playlist && playlist.length > 1) setVideoExpanded(true);
    };
    const hideVideos = (): void => setVideoExpanded(false);

    useEffect(() => {
        if (playlist.length < 2) setVideoExpanded(false);
    }, [playlist]);

    const controller = useAbortController();

    useEffect(() => {
        if (playlist && playlist.length > 0) {
            RequestVideoPreview(playlist[0].youtubeID, controller).then((info: VideoInfo | null) => {
                if (info)
                    setVideoInfo({
                        id: info.id,
                        title: info.title,
                        channel: info.channel,
                        duration: playlist[0].duration,
                        thumbnailURL: info.thumbnailMaxRes.url
                    });
            });
        }
    }, [playlist, controller]);

    const editQueue = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        openEdit(user.clientID);
        event.stopPropagation();
    };

    const cardContent = videoInfo && (
        <div class={style.QueueCard}>
            <div class={style.QueueCardInfo}>
                {videoInfo.thumbnailURL && <img class={style.QueueIcon} src={videoInfo.thumbnailURL} />}
                <div class={style.QueueInfo}>
                    <div class={["mui--text-subhead", commonStyle.textEllipsis].join(" ")}>{videoInfo.title}</div>
                    <div
                        class={["mui--text-body1", commonStyle.textEllipsis].join(" ")}
                    >{`Queued By ${user.name}`}</div>
                    <div class={["mui--text-body1", style.VideoDuration].join(" ")}>
                        {durationToString(videoInfo.duration)}
                    </div>
                </div>
                {allowRemoval && (
                    <div class={style.QueueActionDiv}>
                        <Tooltip content="Edit Video Queue">
                            <Button onClick={editQueue} size="small" variant="fab">
                                <i style={{ fontSize: "32px" }} class="material-icons">
                                    sort
                                </i>
                            </Button>
                        </Tooltip>
                    </div>
                )}
            </div>
        </div>
    );

    const cardVideos = (
        <div
            class={[
                style.QueueVideos,
                videoExpanded && playlist && playlist.length > 1 ? style.QueueVideosExpanded : ""
            ].join(" ")}
        >
            {videoExpanded && (
                <div
                    class={["mui--text-subhead", style.QueueExpandedTitle].join(" ")}
                >{`${user.name}'s Upcoming Videos:`}</div>
            )}
            {videoExpanded &&
                playlist &&
                playlist.map(vid => (
                    <VideoCard
                        key={vid.youtubeID}
                        videoID={vid.youtubeID}
                        duration={vid.duration}
                        actionComponent={
                            allowRemoval ? (
                                <Tooltip content="Remove From Queue">
                                    <Button size="small" variant="fab" onClick={(): void => removeVideo(vid.youtubeID)}>
                                        <i style={{ fontSize: "24px" }} class="material-icons">
                                            delete
                                        </i>
                                    </Button>
                                </Tooltip>
                            ) : (
                                undefined
                            )
                        }
                    />
                ))}
        </div>
    );

    return videoInfo ? (
        <div>
            {playlist && playlist.length > 1 ? (
                <Button
                    className={["mui-btn", "mui-btn--flat", style.VideoCardButton].join(" ")}
                    variant="flat"
                    onClick={videoExpanded ? hideVideos : expandVideos}
                >
                    {cardContent}
                </Button>
            ) : (
                <div class={style.VideoCardButton}>{cardContent}</div>
            )}
            {cardVideos}
        </div>
    ) : (
        <div />
    );
}

export interface VideoQueueProps {
    videoPlaylist: PlaylistByUser;
    userQueue: string[];
    currentUsers: RoomUser[];
    currentUser: string;
    allowRemoval: boolean;
    removeVideo: (id: string) => void;
    openEdit: (id: string) => void;
}

export const VideoQueue = memo(
    (props: VideoQueueProps): JSX.Element => {
        const { userQueue, videoPlaylist, currentUsers, currentUser, removeVideo, openEdit, allowRemoval } = props;

        return (
            <div class={commonStyle.scrollBox}>
                {userQueue.map(clientID => {
                    const playlist = videoPlaylist[clientID];
                    const playlistUser = currentUsers.find(u => u.clientID == clientID);
                    if (playlistUser === undefined) return <div />;
                    return (
                        <UserQueueCard
                            key={clientID}
                            playlist={playlist}
                            user={playlistUser}
                            removeVideo={removeVideo}
                            openEdit={openEdit}
                            allowRemoval={allowRemoval || currentUser === clientID}
                        />
                    );
                })}
            </div>
        );
    },
    (prev: VideoQueueProps, next: VideoQueueProps) => {
        const same =
            prev.videoPlaylist === next.videoPlaylist &&
            prev.userQueue === next.userQueue &&
            prev.currentUser === next.currentUser &&
            prev.currentUsers === next.currentUsers &&
            prev.allowRemoval === next.allowRemoval &&
            prev.removeVideo === next.removeVideo;
        return same;
    }
);
