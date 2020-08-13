import { h, JSX } from "preact";
import * as style from "./style.css";
import { useCallback, useState, useRef, useEffect } from "preact/hooks";
import YouTubeVideo from "../../components/YTPlayer";
import { useWebsockets } from "../../utils/Websockets";
import { WSMessage, MessageType, Video, PlaylistByUser } from "../../utils/WebsocketTypes";
import { RoomUser, YoutubeVideoInformation } from "../../utils/BackendTypes";
import { UserList } from "./UserList";
import { VideoQueue } from "./VideoQueue";
import { Tabs, Tab } from "../../components/Tabs";
import { BottomBar } from "./BottomBar";
import { useGAPIContext } from "../../utils/GAPI";

export interface RoomProps {
    roomID: string;
}

function synchronizeYoutube(player: YT.Player, videoTime: number, playing: boolean): void {
    if (Math.abs(player.getCurrentTime() - videoTime) > 1) {
        player.seekTo(videoTime, true);
    }
    if (player.getPlayerState() === 0) {
        console.log("Video Ended");
        //  TODO: end playback if ws disconnects
    } else if (player.getPlayerState() !== 2 && !playing) {
        player.pauseVideo();
        console.log("pause");
    } else if (player.getPlayerState() !== 1 && playing) {
        player.playVideo();
        console.log("play");
    }
}

export function Room({ roomID }: RoomProps): JSX.Element {
    const [roomTitle, setRoomTitle] = useState("");
    const [currentUsers, setCurrentUsers] = useState<RoomUser[]>([]);
    const [videoPlaylist, setVideoPlaylist] = useState<PlaylistByUser>({});
    const [userQueue, setUserQueue] = useState<string[]>([]);
    const [sidebarTab, setSidebarTab] = useState(0);
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const [videoTime, setVideoTime] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [playerState, setPlayerState] = useState(-1);

    const youtubePlayer = useRef<YT.Player>();

    const setVideoInformation = useCallback((video: Video) => {
        console.log("New Video", video);
        setVideoTime(video.timeStamp);
        setCurrentVideo(video);
        setPlaying(true);
    }, []);

    const getPlayer = useCallback(
        (player: YT.Player) => {
            youtubePlayer.current = player;
            player.addEventListener("onStateChange", e => {
                setPlayerState(e.target.getPlayerState());
            });
            synchronizeYoutube(player, videoTime, playing);
        },
        [videoTime, playing]
    );

    useEffect(() => {
        if (youtubePlayer.current) {
            synchronizeYoutube(youtubePlayer.current, videoTime, playing);
        }
    }, [videoTime, playing, playerState]);

    const newMessage = useCallback(
        (msg: WSMessage) => {
            switch (msg.type) {
                case MessageType.Init:
                    if (msg.Room) {
                        setRoomTitle(msg.Room.roomName);
                        setCurrentUsers(msg.Room.userList);
                        setVideoInformation(msg.Room.video);
                        setVideoPlaylist(msg.Room.playlist);
                        setUserQueue(msg.Room.userQueue);
                    }
                    break;
                case MessageType.Video:
                    if (msg.Video) setVideoInformation(msg.Video);
                    break;
                case MessageType.Play:
                    setPlaying(true);
                    break;
                case MessageType.Pause:
                    setPlaying(false);
                    break;
                case MessageType.Sync:
                    setVideoTime(Number(msg.data));
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
                    break;
            }
        },
        [setVideoInformation]
    );
    const currentAPI = useGAPIContext();
    const isAPILoaded = currentAPI?.isAPILoaded() ?? false;
    const ws = useWebsockets(roomID, newMessage);
    useEffect(() => {
        if (isAPILoaded) ws?.close();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAPILoaded]);

    const togglePlay = (): void => {
        if (ws)
            ws.send(
                JSON.stringify({
                    type: playing ? MessageType.Pause : MessageType.Play
                })
            );
    };

    const submitNewVideo = (newVideo: YoutubeVideoInformation): void => {
        if (ws) {
            ws.send(JSON.stringify({ type: MessageType.QueueAdd, data: newVideo }));
        }
    };

    return (
        <div class={style.PageRoot}>
            <div class={style.splitPane}>
                <div class={style.videoPanel}>
                    <h2>{roomTitle}</h2>
                    <YouTubeVideo className={style.videoDiv} id={currentVideo?.youtubeID ?? ""} getPlayer={getPlayer} />
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
                            />
                        </Tab>
                        <Tab index={1} tabIndex={sidebarTab}>
                            <UserList currentUsers={currentUsers} />
                        </Tab>
                    </div>
                </div>
            </div>
            <BottomBar
                playing={playing}
                currentVideo={currentVideo}
                togglePlay={togglePlay}
                submitNewVideo={submitNewVideo}
            />
        </div>
    );
}
