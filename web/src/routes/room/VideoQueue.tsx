import { h, JSX } from "preact";
import { PlaylistByUser, Video } from "../../utils/WebsocketTypes";
import { RoomUser } from "../../utils/BackendTypes";
import Button from "preact-mui/lib/button";
import { VideoCard, VideoCardInfo } from "../../components/VideoCard";
import * as style from "./style.css";
import { useState, useEffect } from "preact/hooks";
import { RequestVideoPreview } from "../../utils/RestCalls";
import { VideoInfo } from "../../utils/YoutubeTypes";
import { Tooltip } from "../../components/Popup";
import { useAbortController } from "../../components/AbortController";
import { Dropdown, DropdownOption } from "../../components/Dropdown";

export interface UserQueueCardProps {
    user: RoomUser;
    playlist: Video[];
    removeVideo: (id: string) => void;
}

export function UserQueueCard(props: UserQueueCardProps): JSX.Element {
    const { playlist, user, removeVideo } = props;
    const [videoInfo, setVideoInfo] = useState<VideoCardInfo | null>(null);
    const [videoExpanded, setVideoExpanded] = useState<boolean>(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const expandVideos = (): void => {
        if (playlist && playlist.length > 0) setVideoExpanded(true);
    };
    const hideVideos = (): void => setVideoExpanded(false);

    const controller = useAbortController();

    useEffect(() => {
        if (playlist && playlist.length > 0) {
            RequestVideoPreview(playlist[0].youtubeID, controller).then((info: VideoInfo | null) => {
                if (info)
                    setVideoInfo({
                        id: info.id,
                        title: info.title,
                        channel: info.channel,
                        thumbnailURL: info.thumbnailMaxRes.url
                    });
            });
        }
    }, [playlist, controller]);

    const openMenu = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        setMenuOpen(true);
        console.log("open Menu");
        event.stopPropagation();
    };
    const closeMenu = (): void => {
        setMenuOpen(false);
        console.log("close Menu");
    };

    const cardContent = videoInfo && (
        <div class={style.QueueCard}>
            <div class={style.QueueCardInfo}>
                {videoInfo.thumbnailURL && <img class={style.QueueIcon} src={videoInfo.thumbnailURL} />}
                <div class={style.QueueInfo}>
                    <div class={["mui--text-subhead", style.textEllipsis].join(" ")}>{videoInfo.title}</div>
                    <div class={["mui--text-body1", style.textEllipsis].join(" ")}>{`Queued By ${user.name}`}</div>
                </div>
                <div class={style.QueueActionDiv}>
                    <Dropdown
                        base={
                            <Button onClick={openMenu} size="small" variant="fab">
                                <i style={{ fontSize: "32px" }} class="material-icons">
                                    more_vert
                                </i>
                            </Button>
                        }
                        open={menuOpen}
                        onClose={closeMenu}
                    >
                        <DropdownOption>Clear from Queue</DropdownOption>
                        <DropdownOption>Reorder</DropdownOption>
                    </Dropdown>
                </div>
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
            {videoExpanded &&
                playlist.map(vid => (
                    <VideoCard
                        key={vid.youtubeID}
                        videoID={vid.youtubeID}
                        actionComponent={
                            <Tooltip content="Remove From Queue">
                                <Button size="small" variant="fab" onClick={(): void => removeVideo(vid.youtubeID)}>
                                    <i style={{ fontSize: "24px" }} class="material-icons">
                                        delete
                                    </i>
                                </Button>
                            </Tooltip>
                        }
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

export interface VideoQueueProps {
    videoPlaylist: PlaylistByUser;
    userQueue: string[];
    currentUsers: RoomUser[];
    removeVideo: (id: string) => void;
}

export function VideoQueue(props: VideoQueueProps): JSX.Element {
    const { userQueue, videoPlaylist, currentUsers, removeVideo } = props;
    return (
        <div class={style.scrollBox}>
            {userQueue.map(clientID => {
                const playlist = videoPlaylist[clientID];
                const playlistUser = currentUsers.find(u => u.clientID == clientID);
                if (playlistUser === undefined) return <div />;
                return (
                    <UserQueueCard key={clientID} playlist={playlist} user={playlistUser} removeVideo={removeVideo} />
                );
            })}
        </div>
    );
}
