import { h, JSX } from "preact";
import * as style from "./style.css";
import { useCallback, useState, useRef, useEffect } from "preact/hooks";
import Button from "preact-mui/lib/button";
import { YouTubeVideo } from "../../components/YTPlayer";
import { WSMessage, MessageType, Video, PlaylistByUser } from "../../utils/WebsocketTypes";
import { RoomUser } from "../../utils/BackendTypes";
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
import { EditModal } from "./EditModal";
import { useRoomWebsockets } from "./RoomWebsockets";
import { getVolumeCookie, setVolumeCookie } from "../../utils/Cookies";

export interface RoomProps {
    roomID: string;
}

export function Room({ roomID }: RoomProps): JSX.Element {
    const [roomTitle, setRoomTitle] = useState("");
    const [userID, setUserID] = useState("");
    const [currentUsers, setCurrentUsers] = useState<RoomUser[]>([]);
    const [adminUsers, setAdminUsers] = useState<string[]>([]);
    const [videoPlaylist, setVideoPlaylist] = useState<PlaylistByUser>({});
    const [userQueue, setUserQueue] = useState<string[]>([]);
    const [guestControls, setGuestControls] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const [playerVolume, setPlayerVolume] = useState<number>(0);
    const [, setStateIncrement] = useState(0);
    const videoTime = useRef(0);
    const playing = useRef(false);

    const [sidebarTab, setSidebarTab] = useState(0);
    const [editedQueue, setEditedQueue] = useState<string>("");

    const settingsClosed = useRef<() => void | null>(null);
    const editClosed = useRef<() => void | null>(null);

    const youtubePlayer = useRef<YouTubeVideo>();

    useEffect(() => {
        if (roomTitle.length > 0) document.title = "Krono: " + roomTitle;
    }, [roomTitle]);

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
            const Cvol = getVolumeCookie();
            console.log(Cvol);
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
    const {
        ws,
        addAdmin,
        removeAdmin,
        removeAllVideos,
        removeVideo,
        skipVideo,
        submitAllVideos,
        submitNewVideo,
        togglePlay,
        updateSettings,
        reorderQueue,
        logError,
        logReady
    } = useRoomWebsockets(roomID, newMessage);

    useEffect(() => {
        if (apiUser && apiUser.id !== userID) {
            ws?.close();
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

    const openEditModal = useCallback((id: string): void => {
        window.location.href = "#EditQueue";
        setEditedQueue(id);
    }, []);

    useEffect(() => {
        if (window.location.href === "#EditQueue") {
            if (editedQueue.length === 0 || currentUsers.findIndex(u => u.clientID === editedQueue) < 0)
                window.location.href = "#";
        }
    }, [editedQueue, currentUsers]);

    const isAdmin = userID.length > 0 && adminUsers.includes(userID);
    const apiLoaded = (apiUser && currentAPI?.isAPILoaded()) ?? false;
    const hasVideo = youtubePlayer.current?.playerMounted ?? false;

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
                                        onClick={(): string => (window.location.href = "#RoomSettings")}
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
                        playerError={logError}
                        playerReady={logReady}
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
                                openEdit={openEditModal}
                                allowRemoval={isAdmin}
                            />
                        </Tab>
                        <Tab index={1} tabIndex={sidebarTab}>
                            <UserList
                                currentUsers={currentUsers}
                                adminList={adminUsers}
                                isAdmin={isAdmin}
                                userID={userID}
                                addAdmin={addAdmin}
                                removeAdmin={removeAdmin}
                            />
                        </Tab>
                    </div>
                </div>
            </div>
            {isAdmin && (
                <Modal className={style.SettingContainer} idName="RoomSettings" onClose={settingsClosed.current}>
                    <SettingModal
                        roomID={roomID}
                        updateSettings={updateSettings}
                        removeAdmin={removeAdmin}
                        closeCallback={settingsClosed}
                        onClose={(): string => (window.location.href = "#")}
                    />
                </Modal>
            )}
            <Modal className={style.QueueContainer} idName="EditQueue" onClose={editClosed.current}>
                <EditModal
                    userID={editedQueue}
                    playlist={videoPlaylist[editedQueue] ?? []}
                    userName={currentUsers.find(u => u.clientID === editedQueue)?.name ?? ""}
                    self={editedQueue === userID}
                    removeVideo={removeVideo}
                    closeCallback={editClosed}
                    updatePlaylist={(user, newPlaylist): void =>
                        reorderQueue(
                            user,
                            newPlaylist.map(v => ({ videoID: v.youtubeID, duration: v.duration }))
                        )
                    }
                />
            </Modal>
            <BottomBar
                hasVideo={hasVideo}
                playing={playing.current}
                currentVideo={currentVideo}
                togglePlay={(): void => togglePlay(playing.current)}
                skipVideo={skipVideo}
                submitNewVideo={submitNewVideo}
                submitAllVideos={submitAllVideos}
                showControls={guestControls || isAdmin}
                allowQueuing={apiLoaded}
                playerVolume={playerVolume}
                setPlayerVolume={updateVolume}
            />
        </div>
    );
}
