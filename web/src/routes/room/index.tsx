import { h, JSX } from "preact";
import Input from "preact-mui/lib/input";
import Button from "preact-mui/lib/button";
import * as style from "./style.css";
import { useCallback, useState, useRef, useEffect } from "preact/hooks";
import YouTubeVideo from "../../components/YTPlayer";
import { useWebsockets } from "../../utils/Websockets";
import { WSMessage, MessageType, Video } from "../../utils/WebsocketTypes";
import { RoomUser } from "../../utils/BackendTypes";

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

function Room({ roomID }: RoomProps): JSX.Element {
    const [roomTitle, setRoomTitle] = useState("");
    const [currentUsers, setCurrentUsers] = useState<RoomUser[]>([]);
    const [videoPlaylist, setVideoPlaylist] = useState<Video[]>([]);

    const [videoTitle, setVideoTitle] = useState("");
    const [videoID, setVideoID] = useState("");
    const [videoDuration, setVideoDuration] = useState(0);
    const [videoTime, setVideoTime] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [playerState, setPlayerState] = useState(-1);

    const [newVideoID, setNewVideoID] = useState("");

    const youtubePlayer = useRef<YT.Player>();

    const setVideoInformation = useCallback((video: Video) => {
        console.log("New Video", video);
        setVideoTitle(video.title);
        setVideoTime(video.timeStamp);
        setVideoDuration(video.duration);
        setVideoID(video.youtubeID);
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
                default:
                    console.warn("Invalid Websocket Type Received");
                    break;
            }
        },
        [setVideoInformation]
    );

    const ws = useWebsockets(roomID, newMessage);

    const togglePlay = (): void => {
        if (ws)
            ws.send(
                JSON.stringify({
                    type: playing ? MessageType.Pause : MessageType.Play
                })
            );
    };

    const submitNewVideo = (): void => {
        if (ws) {
            ws.send(JSON.stringify({ type: MessageType.QueueAdd, data: newVideoID }));
            setNewVideoID("");
        }
    };

    const updateVideoID = (e: JSX.TargetedEvent<HTMLInputElement, Event>): void => {
        const val = e.currentTarget.value;
        setNewVideoID(val);
    };

    return (
        <div class={style.room}>
            <h1>{roomTitle}</h1>
            <div class={style.splitPane}>
                <div class={style.videoPanel}>
                    <h2>
                        {videoTitle ? `Now Playing ${videoTitle}` : `Nothing Currently Playing`}
                        <Button size="small" variant="fab" onClick={togglePlay}>
                            <i style={{ fontSize: "32px" }} class="material-icons">{playing ? "pause" : "play_arrow"}</i>
                        </Button>
                    </h2>
                    {/* <LinearProgress
                        className={style.progress}
                        progress={videoDuration && videoTime ? videoTime / videoDuration : 0}
                        buffer={1}
                    /> */}
                    <YouTubeVideo className={style.videoDiv} id={videoID} getPlayer={getPlayer} />
                </div>
                <div class={style.sidePanel}>
                    <h2>Current Users:</h2>
                    {currentUsers.map(usr => (
                        <div class="mui--text-title" key={usr.clientID}>{usr.name}</div>
                    ))}
                    <h2>Upcoming Videos:</h2>
                    {videoPlaylist.map(v => (
                        <div class="mui--text-title" key={v.youtubeID}>{v.title}</div>
                    ))}
                    <br />
                    <h3>Set Video: (enter youtube ID)</h3>
                    <Input label="Video ID" value={newVideoID} onChange={updateVideoID} />
                    <Button onClick={submitNewVideo}>Submit</Button>
                </div>
            </div>
        </div>
    );
}

export default Room;
