import { h, JSX } from "preact";
import { PlaylistByUser, Video } from "../../../utils/WebsocketTypes";
import { RoomUser } from "../../../utils/BackendTypes";
import Button from "preact-mui/lib/button";
import { VideoCard, VideoCardInfo } from "../../../components/displayCards/VideoCard";
import { style as panelStyle } from "./panelStyle";
import { style as commonStyle } from "../../../components/sharedStyle";
import { useState, useEffect } from "preact/hooks";
import { RequestVideoPreview } from "../../../utils/RestCalls";
import { durationToString, VideoInfo } from "../../../utils/YoutubeTypes";
import { Tooltip } from "../../../components/Popup";
import { useAbortController } from "../../../utils/AbortController";
import { memo } from "preact/compat";

import MdFormatListNumbered from "@meronex/icons/md/MdFormatListNumbered";
import { css } from "@linaria/core";

const style = {
    QueueVideos: css`
        margin-left: 2rem;
        height: 0;
        overflow-y: auto;
        transition: height 0.25s ease;
        background-color: var(--dp4-surface);
    `,
    QueueVideosExpanded: css`
        max-height: 20rem;
        height: unset;
    `,
    QueueActionDiv: css`
        margin-left: auto;
    `,
    QueueExpandedTitle: css`
        margin: 0.5rem 0.5rem 0 0.5rem;
        padding-left: 1rem;
        border-bottom: 2px solid var(--theme-primary-dark);
    `,
    VideoCardButton: css`
        display: flex;
        height: unset;
        padding: 0;
        width: 100%;
        margin: 0 !important;
        letter-spacing: 0.03em;
    `,
    VideoDuration: css`
        font-weight: 500;
    `,
    PlaylistCardButton: css`
        display: flex;
        height: unset;
        padding: 0;
        width: 100%;
        margin: 0 !important;
        flex-flow: column;
    `,
    QueueCard: css`
        display: flex;
        flex-flow: column;
        padding: 1rem;
        width: 100%;
    `,
    QueueIcon: css`
        height: 5rem;
    `,
    QueueInfo: css`
        height: 5rem;
        flex-direction: column;
        padding-left: 1rem;
        text-align: start;
        display: flex;
        overflow: hidden;
    `,
    QueueCardInfo: css`
        display: flex;
        flex-flow: row;
    `,
}

interface UserQueueCardProps {
    allowRemoval: boolean;
    user: RoomUser;
    playlist: Video[];
    openEdit: (id: string) => void;
}

function UserQueueCard(props: UserQueueCardProps): JSX.Element {
    const { playlist, user, openEdit, allowRemoval } = props;
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
                                <MdFormatListNumbered size="2rem" />
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
                playlist.map((vid) => (
                    <VideoCard
                        key={vid.youtubeID}
                        videoID={vid.youtubeID}
                        duration={vid.duration}
                        enablePreview={false}
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
    openEdit: (id: string) => void;
}

export const VideoQueue = memo(
    (props: VideoQueueProps): JSX.Element => {
        const { userQueue, videoPlaylist, currentUsers, currentUser, openEdit, allowRemoval } = props;

        return (
            <div class={panelStyle.scrollBox}>
                {userQueue.map((clientID) => {
                    const playlist = videoPlaylist[clientID];
                    const playlistUser = currentUsers.find((u) => u.clientID == clientID);
                    if (playlistUser === undefined || !playlist || playlist.length === 0) return <div />;
                    return (
                        <UserQueueCard
                            key={clientID}
                            playlist={playlist}
                            user={playlistUser}
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
            prev.allowRemoval === next.allowRemoval;
        return same;
    }
);
