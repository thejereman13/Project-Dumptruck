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

export interface RoomProps {
    roomID: string;
}

export function Room({ roomID }: RoomProps): JSX.Element {
    const [roomTitle, setRoomTitle] = useState("");
    const [userID, setUserID] = useState("");
    const [currentUsers, setCurrentUsers] = useState<RoomUser[]>([]);
    const [videoPlaylist, setVideoPlaylist] = useState<PlaylistByUser>({});
    const [userQueue, setUserQueue] = useState<string[]>([]);
    const [sidebarTab, setSidebarTab] = useState(0);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const [, setStateIncrement] = useState(0);
    const videoTime = useRef(0);
    const playing = useRef(false);

    const youtubePlayer = useRef<YouTubeVideo>();

    const setVideoInformation = useCallback((video: Video) => {
        console.log("New Video", video);
        videoTime.current = video.timeStamp;
        setCurrentVideo(video);
        playing.current = true;
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
                        setVideoInformation(msg.Room.video);
                        setVideoPlaylist(msg.Room.playlist);
                        setUserQueue(msg.Room.userQueue);
                        playing.current = msg.Room.video.playing;
                    }
                    break;
                case MessageType.Room:
                    if (msg.Room) {
                        setRoomTitle(msg.Room.roomName);
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
                    console.log("sync: ", msg.data);
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

    const togglePlay = (): void => {
        if (ws)
            ws.send(
                JSON.stringify({
                    type: playing.current ? MessageType.Pause : MessageType.Play
                })
            );
    };
    const skipVideo = (): void => {
        if (ws) ws.send(JSON.stringify({ type: MessageType.Skip }));
    };

    const submitNewVideo = (newVideo: YoutubeVideoInformation): void => {
        if (ws) {
            ws.send(JSON.stringify({ type: MessageType.QueueAdd, data: newVideo }));
        }
    };
    const submitAllVideos = (newVideos: YoutubeVideoInformation[]): void => {
        if (ws) {
            ws.send(JSON.stringify({ type: MessageType.QueueMultiple, data: newVideos }));
        }
    };
    const removeVideo = (id: string): void => {
        if (ws) {
            ws.send(JSON.stringify({ type: MessageType.QueueRemove, data: id }));
        }
    };
    const updateSettings = (settings: RoomSettings): void => {
        if (ws) {
            ws.send(JSON.stringify({ type: MessageType.RoomSettings, data: settings }));
        }
    };

    return (
        <div class={style.PageRoot}>
            <div class={style.splitPane}>
                <div class={style.videoPanel}>
                    <div>
                        <div class={["mui--text-display1", style.centerTooltipChild].join(" ")}>
                            {roomTitle}
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
                                currentUsers={currentUsers}
                                removeVideo={removeVideo}
                            />
                        </Tab>
                        <Tab index={1} tabIndex={sidebarTab}>
                            <UserList currentUsers={currentUsers} />
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
            />
        </div>
    );
}
