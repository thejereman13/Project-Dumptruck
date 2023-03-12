import { useParams } from "@solidjs/router";
import { createEffect, createSignal, JSX, onCleanup, onMount, Show } from "solid-js";
import { css } from "solid-styled-components";
import { setRoomName } from "./components/Header";
import { RegisterNotification } from "./components/Notification";
import { BottomBar } from "./components/room/BottomBar";
import { useRoomWebsockets } from "./components/room/RoomWebsockets";
import { SidePanel } from "./components/room/SidePanel";
import { YoutubeConstructor } from "./components/room/YTPlayer";
import { siteUser } from "./Login";
import { useAbortController } from "./utils/AbortController";
import { RoomUser, RoomInfo } from "./utils/BackendTypes";
import { getVolumeCookie, setVolumeCookie } from "./utils/Cookies";
import { GetRoomHistory, GetRoomInfo } from "./utils/RestCalls";
import { MessageType, PlaylistByUser, Video, WSMessage } from "./utils/WebsocketTypes";

const style = {
    pageRoot: css`
        padding-top: var(--navbar-height);
        min-height: 100%;
        width: 100%;
        max-height: 100%;
        display: flex;
        flex-flow: column;
    `,
    nonexistantRoom: css`
        display: flex;
        justify-content: center;
        margin-top: 4rem;
    `,
    splitPane: css`
        display: flex;
        flex-direction: row;
        flex: auto;
        overflow-y: hidden;
        @media (max-width: 960px) {
            flex-direction: column;
        }
    `,
    videoPanel: css`
        width: 100%;
        display: flex;
        flex-flow: column;
        padding: 1rem;
        flex: auto;
        min-height: 33vh;
    `,
    videoDiv: css`
        height: 100%;
        display: flex;
        flex: auto;
        & iframe {
            width: 100%;
            height: auto;
        }
    `,
};

export function Room(): JSX.Element {
    const { roomID } = useParams();
    const [userID, setUserID] = createSignal("");
    const [currentUsers, setCurrentUsers] = createSignal<RoomUser[]>([]);
    const [adminUsers, setAdminUsers] = createSignal<string[]>([]);
    const [videoPlaylist, setVideoPlaylist] = createSignal<PlaylistByUser>({});
    const [userQueue, setUserQueue] = createSignal<string[]>([]);
    const [videoHistory, setVideoHistory] = createSignal<string[]>([]);
    const [guestControls, setGuestControls] = createSignal(false);
    const [currentVideo, setCurrentVideo] = createSignal<Video | null>(null);
    const [playerVolume, setPlayerVolume] = createSignal<number>(0);
    const [roomSettings, setRoomSettings] = createSignal<RoomInfo | null>(null);
    const [roomNonexistant, setRoomNonexistant] = createSignal(false);
    const [videoTime, setVideoTime] = createSignal(0);
    const [playing, setPlaying] = createSignal(false);
    let lastMessage = 0;
    let currVid: Video | null = null;
    currVid = currentVideo();

    const youtubePlayer = YoutubeConstructor();
    const YoutubeVideo = youtubePlayer.component;

    const controller = useAbortController();

    let tm: ReturnType<typeof setInterval> | undefined = undefined;
    onMount(() => {
        GetRoomInfo(controller, roomID).then((res) => {
            if (res === null) {
                setRoomNonexistant(true);
            }
        });
        GetRoomHistory(controller, roomID).then((res) => {
            if (res !== null) setVideoHistory(res);
        });
        tm = setInterval(() => {
            const ct = new Date().getTime();
            if (currVid === null && lastMessage && ct - lastMessage > 30 * 60 * 1000) {
                // 30 minute timeout with no player
                document.location.href = "/";
            }
        }, 60 * 1000);
    });

    onCleanup(() => {
        setRoomName("");
        clearInterval(tm);
    });

    createEffect(() => {
        GetRoomInfo(controller, roomID).then((settings) => {
            if (!controller.signal.aborted) setRoomSettings(settings);
            if (settings === null) RegisterNotification("Failed to Retrieve Room Settings", "error");
        });
    });

    const setVideoInformation = (video: Video | null) => {
        setCurrentVideo(video);
        if (video) {
            setVideoTime(video.timeStamp);
            setPlaying(video.playing);
        }
    };

    const playerMount = (): void => {
        youtubePlayer.synchronizeYoutube(videoTime(), playing());
        const Cvol = getVolumeCookie();
        if (Cvol < 0) {
            setPlayerVolume(youtubePlayer.getVolume());
        } else {
            setPlayerVolume(youtubePlayer.setVolume(Cvol));
        }
    };

    createEffect(() => {
        youtubePlayer.synchronizeYoutube(videoTime(), playing());
    });

    const newMessage = (msg: WSMessage) => {
        if (msg.t !== MessageType.Ping) {
            lastMessage = new Date().getTime();
        }
        switch (msg.t) {
            case MessageType.Ping:
                break;
            case MessageType.Init:
                setUserID(msg.ID ?? "");
                if (msg.Room) {
                    setRoomName(msg.Room.roomName);
                    setCurrentUsers(msg.Room.userList);
                    setAdminUsers(msg.Room.adminList);
                    setVideoInformation(msg.Room.video ?? null);
                    setVideoPlaylist(msg.Room.playlist);
                    setUserQueue(msg.Room.userQueue);
                    setGuestControls(msg.Room.guestControls);
                    setPlaying(msg.Room.video?.playing ?? false);
                }
                break;
            case MessageType.Room:
                if (msg.Room) {
                    setRoomName(msg.Room.roomName);
                    setGuestControls(msg.Room.guestControls);
                    setAdminUsers(msg.Room.adminList);
                }
                break;
            case MessageType.Video:
                if (msg.Video)
                    setVideoHistory((h) => {
                        const v = msg.Video;
                        if (v) {
                            h = h.slice(0, 248);
                            h.unshift(v.youtubeID);
                        }
                        return h;
                    });
                setVideoInformation(msg.Video ?? null);
                break;
            case MessageType.Play:
                setPlaying(true);
                break;
            case MessageType.Pause:
                setPlaying(false);
                break;
            case MessageType.Sync:
                setVideoTime(Number(msg.d));
                break;
            case MessageType.UserList:
                setCurrentUsers(msg.d);
                break;
            case MessageType.QueueOrder:
                setVideoPlaylist(msg.d);
                break;
            case MessageType.UserOrder:
                setUserQueue(msg.d);
                break;
            case MessageType.Error:
                RegisterNotification(msg.error ?? "Room Error", "error");
                break;
            default:
                console.warn("Invalid Websocket Type Received");
                return;
        }
    };
    const wsCallbacks = useRoomWebsockets(roomID, newMessage);

    createSignal(() => {
        if (siteUser() && siteUser()!.id !== userID()) {
            wsCallbacks.ws?.close();
            setUserID(siteUser()!.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    });

    const updateVolume = (vol: number): void => {
        setPlayerVolume(youtubePlayer.setVolume(vol));
        setVolumeCookie(vol);
    };

    const togglePlay = () => {
        wsCallbacks.togglePlay(playing());
    };

    const isAdmin = () => userID().length > 0 && adminUsers().includes(userID());
    const apiLoaded = () => (siteUser() && siteUser()!.access_token.length > 0) ?? false;
    const hasVideo = () => youtubePlayer.isPlayerMounted();

    return (
        <div class={style.pageRoot}>
            <Show
                when={!roomNonexistant()}
                fallback={
                    <div class={style.nonexistantRoom}>
                        <h1>Room Does not Exist</h1>
                    </div>
                }
            >
                <div class={style.splitPane}>
                    <div class={style.videoPanel}>
                        <YoutubeVideo
                            className={style.videoDiv}
                            id={currentVideo()?.youtubeID ?? ""}
                            playerMount={playerMount}
                            playerError={wsCallbacks.logError}
                            playerReady={wsCallbacks.logReady}
                            seekTo={wsCallbacks.seekVideo}
                        />
                    </div>
                    <SidePanel
                        playing={playing()}
                        playerVolume={playerVolume()}
                        setPlayerVolume={updateVolume}
                        adminPermissions={isAdmin()}
                        adminUsers={adminUsers()}
                        history={videoHistory()}
                        currentUsers={currentUsers()}
                        roomSettings={roomSettings()}
                        setRoomSettings={setRoomSettings}
                        userID={userID()}
                        userQueue={userQueue()}
                        videoPlaylist={videoPlaylist()}
                        wsCallbacks={wsCallbacks}
                        allowQueuing={apiLoaded()}
                    />
                </div>
            </Show>
            <Show when={!roomNonexistant()}>
                <BottomBar
                    hasVideo={hasVideo()}
                    playing={playing()}
                    currentVideo={currentVideo()}
                    userList={currentUsers()}
                    togglePlay={togglePlay}
                    skipVideo={wsCallbacks.skipVideo}
                    canPause={guestControls() || isAdmin()}
                    canSkip={guestControls() || isAdmin() || currentVideo()?.queuedBy === userID()}
                    playerVolume={playerVolume()}
                    setPlayerVolume={updateVolume}
                />
            </Show>
        </div>
    );
}
