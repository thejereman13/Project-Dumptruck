import { h, JSX } from "preact";
import * as style from "./style.css";
import { useCallback, useState, useRef, useEffect } from "preact/hooks";
import Button from "preact-mui/lib/button";
import { YouTubeVideo } from "../../components/YTPlayer";
import { useWebsockets } from "../../utils/Websockets";
import { WSMessage, MessageType, Video, PlaylistByUser } from "../../utils/WebsocketTypes";
import { RoomUser, YoutubeVideoInformation, RoomSettings } from "../../utils/BackendTypes";
import { UserList } from "./UserList";
import { VideoQueue } from "./VideoQueue";
import { Tabs, Tab } from "../../components/Tabs";
import { BottomBar } from "./BottomBar";
import { useGAPIContext } from "../../utils/GAPI";
import { Modal } from "../../components/Modal";
import { SettingModal } from "./SettingModal";
import { Tooltip } from "../../components/Popup";
import { RegisterNotification } from "../../components/Notification";
import { CopyToClipboard } from "../../utils/Clipboard";

export interface RoomProps {
    roomID: string;
}

const WSErrorMessage = (): void => {
    RegisterNotification("Failed to Connect to Server", "error");
};

export function Room({ roomID }: RoomProps): JSX.Element {
    const [roomTitle, setRoomTitle] = useState("");
    const [userID, setUserID] = useState("");
    const [currentUsers, setCurrentUsers] = useState<RoomUser[]>([]);
    const [adminUsers, setAdminUsers] = useState<string[]>([]);
    const [videoPlaylist, setVideoPlaylist] = useState<PlaylistByUser>({});
    const [userQueue, setUserQueue] = useState<string[]>([]);
    const [guestControls, setGuestControls] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const [, setStateIncrement] = useState(0);
    const videoTime = useRef(0);
    const playing = useRef(false);

    const [sidebarTab, setSidebarTab] = useState(0);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const youtubePlayer = useRef<YouTubeVideo>();

    const setVideoInformation = useCallback((video: Video) => {
        console.log("New Video", video);
        videoTime.current = video.timeStamp;
        setCurrentVideo(video);
        playing.current = video.playing;
        setStateIncrement(val => val + 1);
    }, []);

    const playerMount = useCallback((): void => {
        if (youtubePlayer.current) {
            youtubePlayer.current.synchronizeYoutube(videoTime.current, playing.current);
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
            switch (msg.type) {
                case MessageType.Init:
                    setUserID(msg.ID ?? "");
                    if (msg.Room) {
                        setRoomTitle(msg.Room.roomName);
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
                        setRoomTitle(msg.Room.roomName);
                        setGuestControls(msg.Room.guestControls);
                        setAdminUsers(msg.Room.adminList);
                    }
                    break;
                case MessageType.Video:
                    if (msg.Video) setVideoInformation(msg.Video);
                    break;
                case MessageType.Play:
                    playing.current = true;
                    break;
                case MessageType.Pause:
                    playing.current = false;
                    break;
                case MessageType.Sync:
                    videoTime.current = Number(msg.data);
                    break;
                case MessageType.UserList:
                    setCurrentUsers(msg.data);
                    break;
                case MessageType.QueueOrder:
                    setVideoPlaylist(msg.data);
                    break;
                case MessageType.UserOrder:
                    setUserQueue(msg.data);
                    break;
                case MessageType.Error:
                    RegisterNotification(msg.error ?? "Room Error", "error");
                    break;
                default:
                    console.warn("Invalid Websocket Type Received");
                    return;
            }
            setStateIncrement(val => (val + 1) % 65536);
        },
        [setVideoInformation]
    );
    const currentAPI = useGAPIContext();
    const apiUser = currentAPI?.getUser() ?? null;
    const ws = useWebsockets(roomID, newMessage);
    useEffect(() => {
        if (apiUser && apiUser.id !== userID) {
            ws?.close();
            setUserID(apiUser.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiUser]);

    const togglePlay = useCallback((): void => {
        if (ws)
            ws.send(
                JSON.stringify({
                    type: playing.current ? MessageType.Pause : MessageType.Play
                })
            );
        else {
            WSErrorMessage();
        }
    }, [ws]);
    const skipVideo = useCallback((): void => {
        if (ws) ws.send(JSON.stringify({ type: MessageType.Skip }));
    }, [ws]);

    const submitNewVideo = useCallback(
        (newVideo: YoutubeVideoInformation, videoTitle = ""): void => {
            if (ws) {
                ws.send(JSON.stringify({ type: MessageType.QueueAdd, data: newVideo }));
                RegisterNotification(`Queued ${videoTitle.length > 0 ? videoTitle : "Video"}`, "info");
            } else {
                WSErrorMessage();
            }
        },
        [ws]
    );
    const submitAllVideos = useCallback(
        (newVideos: YoutubeVideoInformation[], playlistTitle: string): void => {
            if (ws) {
                ws.send(JSON.stringify({ type: MessageType.QueueMultiple, data: newVideos }));
                RegisterNotification(
                    `Queued All Videos from ${playlistTitle.length > 0 ? playlistTitle : "Playlist"}`,
                    "info"
                );
            } else {
                WSErrorMessage();
            }
        },
        [ws]
    );
    const removeVideo = useCallback(
        (id: string): void => {
            if (ws) {
                ws.send(JSON.stringify({ type: MessageType.QueueRemove, data: id }));
            } else {
                WSErrorMessage();
            }
        },
        [ws]
    );
    const removeAllVideos = useCallback(
        (userID: string): void => {
            if (ws) {
                ws.send(JSON.stringify({ type: MessageType.QueueClear, data: userID }));
            } else {
                WSErrorMessage();
            }
        },
        [ws]
    );
    const updateSettings = useCallback(
        (settings: RoomSettings): void => {
            if (ws) {
                ws.send(JSON.stringify({ type: MessageType.RoomSettings, data: settings }));
            } else {
                WSErrorMessage();
            }
        },
        [ws]
    );

    const isAdmin = userID.length > 0 && adminUsers.includes(userID);
    const apiLoaded = (apiUser && currentAPI?.isAPILoaded()) ?? false;

    return (
        <div class={style.PageRoot}>
            <div class={style.splitPane}>
                <div class={style.videoPanel}>
                    <div>
                        <div class={["mui--text-display1", style.centerTooltipChild].join(" ")}>
                            {roomTitle}
                            {roomTitle && (
                                <Tooltip
                                    className={[style.centerTooltipChild, style.settingButton].join(" ")}
                                    content="Share Room URL"
                                >
                                    <Button
                                        size="small"
                                        variant="fab"
                                        color="accent"
                                        onClick={(): void => CopyToClipboard(document.URL, "Room URL")}
                                    >
                                        <i style={{ fontSize: "28px" }} class="material-icons">
                                            share
                                        </i>
                                    </Button>
                                </Tooltip>
                            )}
                            {isAdmin && (
                                <Tooltip
                                    className={[style.centerTooltipChild, style.settingButton].join(" ")}
                                    content="Edit Room Settings"
                                >
                                    <Button
                                        size="small"
                                        variant="fab"
                                        color="accent"
                                        onClick={(): void => setSettingsOpen(true)}
                                    >
                                        <i style={{ fontSize: "28px" }} class="material-icons">
                                            settings
                                        </i>
                                    </Button>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                    <YouTubeVideo
                        ref={youtubePlayer}
                        className={style.videoDiv}
                        id={currentVideo?.youtubeID ?? ""}
                        playerMount={playerMount}
                    />
                </div>
                <div class={style.sidePanel}>
                    <Tabs
                        tabNames={["Video Queue", "Room Users"]}
                        onIndex={setSidebarTab}
                        index={sidebarTab}
                        justified
                    />
                    <div class={style.sidePanelTabBody}>
                        <Tab index={0} tabIndex={sidebarTab}>
                            <VideoQueue
                                videoPlaylist={videoPlaylist}
                                userQueue={userQueue}
                                currentUser={userID}
                                currentUsers={currentUsers}
                                removeVideo={removeVideo}
                                removeAll={removeAllVideos}
                                allowRemoval={isAdmin}
                            />
                        </Tab>
                        <Tab index={1} tabIndex={sidebarTab}>
                            <UserList currentUsers={currentUsers} adminList={adminUsers} />
                        </Tab>
                    </div>
                </div>
            </div>
            <Modal className={style.SettingContainer} open={settingsOpen} onClose={(): void => setSettingsOpen(false)}>
                <SettingModal
                    roomID={roomID}
                    updateSettings={updateSettings}
                    onClose={(): void => setSettingsOpen(false)}
                />
            </Modal>
            <BottomBar
                playing={playing.current}
                currentVideo={currentVideo}
                togglePlay={togglePlay}
                skipVideo={skipVideo}
                submitNewVideo={submitNewVideo}
                submitAllVideos={submitAllVideos}
                showControls={guestControls || isAdmin}
                allowQueuing={apiLoaded}
            />
        </div>
    );
}
