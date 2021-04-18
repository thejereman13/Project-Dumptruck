import { h, JSX } from "preact";
import * as style from "./style.css";
import { useCallback, useState, useRef, useEffect } from "preact/hooks";
import { YouTubeVideo } from "../../components/YTPlayer";
import { WSMessage, MessageType, Video, PlaylistByUser } from "../../utils/WebsocketTypes";
import { RoomInfo, RoomUser } from "../../utils/BackendTypes";
import { useGAPIContext } from "../../utils/GAPI";
import { RegisterNotification } from "../../components/Notification";
import { useRoomWebsockets } from "./RoomWebsockets";
import { getVolumeCookie, setVolumeCookie } from "../../utils/Cookies";
import { GetRoomInfo } from "../../utils/RestCalls";
import { useAbortController } from "../../utils/AbortController";
import { NotifyChannel } from "../../utils/EventSubscriber";
import { SidePanel } from "./components/SidePanel";
import { BottomBar } from "./components/BottomBar";

export interface RoomProps {
    roomID: string;
}

export function Room({ roomID }: RoomProps): JSX.Element {
    const [userID, setUserID] = useState("");
    const [currentUsers, setCurrentUsers] = useState<RoomUser[]>([]);
    const [adminUsers, setAdminUsers] = useState<string[]>([]);
    const [videoPlaylist, setVideoPlaylist] = useState<PlaylistByUser>({});
    const [userQueue, setUserQueue] = useState<string[]>([]);
    const [guestControls, setGuestControls] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const [playerVolume, setPlayerVolume] = useState<number>(0);
    const [roomSettings, setRoomSettings] = useState<RoomInfo | null>(null);
    const [, setStateIncrement] = useState(0);
    const videoTime = useRef(0);
    const playing = useRef(false);

    const youtubePlayer = useRef<YouTubeVideo>();

    const [roomNonexistant, setRoomNonexistant] = useState<boolean>(false);
    const controller = useAbortController();
    useEffect(() => {
        GetRoomInfo(roomID, controller).then((res) => {
            if (res === null) {
                setRoomNonexistant(true);
            }
        });
        return (): void => {
            NotifyChannel("roomName", "");
        };
    }, [roomID, controller]);

    useEffect(() => {
        GetRoomInfo(roomID, controller).then((settings) => {
            if (!controller.current.signal.aborted) setRoomSettings(settings);
            if (settings === null) RegisterNotification("Failed to Retrieve Room Settings", "error");
        });
    }, [roomID, adminUsers, controller]);

    const setVideoInformation = useCallback((video: Video | null) => {
        console.log("New Video", video);
        setCurrentVideo(video);
        setStateIncrement((val) => val + 1);
        if (video) {
            videoTime.current = video.timeStamp;
            playing.current = video.playing;
        }
    }, []);

    const playerMount = useCallback((): void => {
        if (youtubePlayer.current) {
            youtubePlayer.current.synchronizeYoutube(videoTime.current, playing.current);
            const Cvol = getVolumeCookie();
            if (Cvol < 0) {
                setPlayerVolume(youtubePlayer.current.getVolume());
            } else {
                setPlayerVolume(youtubePlayer.current.setVolume(Cvol));
            }
        }
    }, []);

    const videoTimeStamp = videoTime.current;
    const playbackState = playing.current;
    useEffect(() => {
        if (youtubePlayer.current) {
            youtubePlayer.current.synchronizeYoutube(videoTimeStamp, playbackState);
        }
    }, [videoTimeStamp, playbackState]);

    const newMessage = useCallback(
        (msg: WSMessage) => {
            switch (msg.t) {
                case MessageType.Init:
                    setUserID(msg.ID ?? "");
                    if (msg.Room) {
                        NotifyChannel("roomName", msg.Room.roomName);
                        setCurrentUsers(msg.Room.userList);
                        setAdminUsers(msg.Room.adminList);
                        setVideoInformation(msg.Room.video);
                        setVideoPlaylist(msg.Room.playlist);
                        setUserQueue(msg.Room.userQueue);
                        setGuestControls(msg.Room.guestControls);
                        playing.current = msg.Room.video.playing;
                    }
                    break;
                case MessageType.Room:
                    if (msg.Room) {
                        NotifyChannel("roomName", msg.Room.roomName);
                        setGuestControls(msg.Room.guestControls);
                        setAdminUsers(msg.Room.adminList);
                    }
                    break;
                case MessageType.Video:
                    setVideoInformation(msg.Video ?? null);
                    break;
                case MessageType.Play:
                    playing.current = true;
                    break;
                case MessageType.Pause:
                    playing.current = false;
                    break;
                case MessageType.Sync:
                    videoTime.current = Number(msg.d);
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
            setStateIncrement((val) => (val + 1) % 65536);
        },
        [setVideoInformation]
    );
    const currentAPI = useGAPIContext();
    const apiUser = currentAPI?.getUser() ?? null;
    const wsCallbacks = useRoomWebsockets(roomID, newMessage);

    useEffect(() => {
        if (apiUser && apiUser.id !== userID) {
            wsCallbacks.ws?.close();
            setUserID(apiUser.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiUser]);

    const updateVolume = useCallback((vol: number): void => {
        if (youtubePlayer.current) {
            setPlayerVolume(youtubePlayer.current.setVolume(vol));
            setVolumeCookie(vol);
        }
    }, []);

    const isAdmin = userID.length > 0 && adminUsers.includes(userID);
    const apiLoaded = (apiUser && currentAPI?.isAPILoaded()) ?? false;
    const hasVideo = youtubePlayer.current?.playerMounted ?? false;

    return (
        <div class={style.PageRoot}>
            {roomNonexistant ? (
                <div class={style.NonexistantRoom}>
                    <h1>Room Does not Exist</h1>
                </div>
            ) : (
                <div class={style.splitPane}>
                    <div class={style.videoPanel}>
                        <YouTubeVideo
                            ref={youtubePlayer}
                            className={style.videoDiv}
                            id={currentVideo?.youtubeID ?? ""}
                            playerMount={playerMount}
                            playerError={wsCallbacks.logError}
                            playerReady={wsCallbacks.logReady}
                        />
                    </div>
                    <SidePanel
                        playing={playing.current}
                        playerVolume={playerVolume}
                        setPlayerVolume={updateVolume}
                        adminPermissions={isAdmin}
                        adminUsers={adminUsers}
                        currentUsers={currentUsers}
                        roomSettings={roomSettings}
                        setRoomSettings={setRoomSettings}
                        userID={userID}
                        userQueue={userQueue}
                        videoPlaylist={videoPlaylist}
                        wsCallbacks={wsCallbacks}
                        allowQueuing={apiLoaded}
                    />
                </div>
            )}
            {roomNonexistant ? (
                <div />
            ) : (
                <BottomBar
                    hasVideo={hasVideo}
                    playing={playing.current}
                    currentVideo={currentVideo}
                    togglePlay={(): void => wsCallbacks.togglePlay(playing.current)}
                    skipVideo={wsCallbacks.skipVideo}
                    showControls={guestControls || isAdmin}
                    allowQueuing={apiLoaded}
                    playerVolume={playerVolume}
                    setPlayerVolume={updateVolume}
                />
            )}
        </div>
    );
}
