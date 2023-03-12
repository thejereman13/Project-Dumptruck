import { PlaylistByUser, Video } from "../../utils/WebsocketTypes";
import { RoomUser } from "../../utils/BackendTypes";
import { VideoCard, VideoCardInfo } from "../../components/displayCards/VideoCard";
import { style as panelStyle } from "./panelStyle";
import { style as commonStyle } from "../../components/sharedStyle";
import { RequestVideoPreview } from "../../utils/RestCalls";
import { durationToString, VideoInfo } from "../../utils/YoutubeTypes";
import { useAbortController } from "../../utils/AbortController";
import { css } from "solid-styled-components";
import { createEffect, createSignal, For, JSX, Show } from "solid-js";
import { TbListNumbers } from "solid-icons/tb";

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
};

interface UserQueueCardProps {
    allowRemoval: boolean;
    user: RoomUser;
    playlist: Video[];
    openEdit: (id: string) => void;
}

function UserQueueCard(props: UserQueueCardProps): JSX.Element {
    const [videoInfo, setVideoInfo] = createSignal<VideoCardInfo | null>(null);
    const [videoExpanded, setVideoExpanded] = createSignal<boolean>(false);

    const expandVideos = (): void => {
        if (props.playlist && props.playlist.length > 1) setVideoExpanded(true);
    };
    const hideVideos = () => setVideoExpanded(false);

    createEffect(() => {
        if (props.playlist.length < 2) setVideoExpanded(false);
    });

    const controller = useAbortController();

    createEffect(() => {
        if (props.playlist && props.playlist.length > 0) {
            RequestVideoPreview(controller, props.playlist[0].youtubeID).then((info: VideoInfo | null) => {
                if (info) {
                    setVideoInfo({
                        id: info.id,
                        title: info.title,
                        channel: info.channel,
                        duration: props.playlist[0].duration,
                        thumbnailURL: info.thumbnailMaxRes.url,
                    });
                }
            });
        }
    });

    const editQueue: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (event): void => {
        props.openEdit(props.user.clientID);
        event.stopPropagation();
    };

    const cardContent = (
        <Show when={videoInfo()}>
            {(info) => (
                <div class={style.QueueCard}>
                    <div class={style.QueueCardInfo}>
                        {info.thumbnailURL && <img class={style.QueueIcon} src={info.thumbnailURL} />}
                        <div class={style.QueueInfo}>
                            <div class={`text-base normal-case font-medium ${commonStyle.textEllipsis}`}>
                                {info.title}
                            </div>
                            <div
                                class={`text-sm font-medium normal-case ${commonStyle.textEllipsis}`}
                            >{`Queued By ${props.user.name}`}</div>
                            <div class={`text-sm font-light ${style.VideoDuration}`}>
                                {durationToString(info.duration)}
                            </div>
                        </div>
                        <Show when={props.allowRemoval}>
                            <div class={style.QueueActionDiv}>
                                <button
                                    class="btn btn-circle btn-ghost btn-primary tooltip tooltip-left inline-flex"
                                    data-tip="Edit Video Queue"
                                    onClick={editQueue}
                                >
                                    <TbListNumbers size="2rem" />
                                </button>
                            </div>
                        </Show>
                    </div>
                </div>
            )}
        </Show>
    );

    const cardVideos = (
        <div
            classList={{
                [style.QueueVideos]: true,
                [style.QueueVideosExpanded]: videoExpanded() && props.playlist && props.playlist.length > 1,
            }}
        >
            <Show when={videoExpanded()}>
                <div class={style.QueueExpandedTitle}>{`${props.user.name}'s Upcoming Videos:`}</div>
            </Show>
            <Show when={videoExpanded() && props.playlist}>
                <For each={props.playlist}>
                    {(vid) => <VideoCard videoID={vid.youtubeID} duration={vid.duration} enablePreview={false} />}
                </For>
            </Show>
        </div>
    );

    return (
        <Show when={videoInfo()} fallback={<div />}>
            <div>
                <Show
                    when={props.playlist && props.playlist.length > 1}
                    fallback={<div class={style.VideoCardButton}>{cardContent}</div>}
                >
                    <button
                        class={`btn btn-ghost no-animation ${style.VideoCardButton}`}
                        onClick={videoExpanded() ? hideVideos : expandVideos}
                    >
                        {cardContent}
                    </button>
                </Show>
                {cardVideos}
            </div>
        </Show>
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

export function VideoQueue(props: VideoQueueProps): JSX.Element {
    const queuesInOrder = () =>
        props.userQueue.map((usr) => [usr, props.videoPlaylist[usr]] as [string, PlaylistByUser[string]]);

    return (
        <div class={panelStyle.scrollBox}>
            <For each={queuesInOrder()}>
                {([clientID, playlist]) => {
                    const playlistUser = props.currentUsers.find((u) => u.clientID == clientID);
                    if (playlistUser === undefined || !playlist || playlist.length === 0) return <div />;
                    return (
                        <UserQueueCard
                            playlist={playlist}
                            user={playlistUser}
                            openEdit={props.openEdit}
                            allowRemoval={props.allowRemoval || props.currentUser === clientID}
                        />
                    );
                }}
            </For>
        </div>
    );
}
