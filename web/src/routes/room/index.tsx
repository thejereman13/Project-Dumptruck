import { h, JSX } from "preact";
import LinearProgress from "preact-material-components/LinearProgress";
import Icon from "preact-material-components/Icon";
import IconButton from "preact-material-components/IconButton";
import TextField from "preact-material-components/TextField";
import Button from "preact-material-components/Button";
import * as style from './style.css';
import { useCallback, useState, useRef, useEffect } from "preact/hooks";
import Menu from "preact-material-components/Menu";
import YouTubeVideo from "../../components/YTPlayer";
import { useWebsockets } from "../../utils/Websockets";
import { WSMessage, MessageType, User, Video } from "../../utils/WebsocketTypes";

export interface RoomProps {
    roomID: string;
}

function synchronizeYoutube(player: YT.Player, videoTime: number, playing: boolean) {
    if (Math.abs(player.getCurrentTime() - videoTime) > 1) {
        player.seekTo(videoTime, true);
    }
    if (player.getPlayerState() === 0) {
        console.log('Video Ended');
    } else if (player.getPlayerState() !== 2 && !playing) {
        player.pauseVideo();
        console.log('pause');
    } else if (player.getPlayerState() !== 1 && playing) {
        player.playVideo();
        console.log('play');
    }
}

function Room({ roomID }: RoomProps) {

    const [roomTitle, setRoomTitle] = useState('');
    const [videoTitle, setVideoTitle] = useState('');
    const [videoID, setVideoID] = useState('');
    const [videoDuration, setVideoDuration] = useState(0);
    const [videoTime, setVideoTime] = useState(0);
    const [currentUsers, setCurrentUsers] = useState<User[]>([]);
    const [playing, setPlaying] = useState(false);
    const [playerState, setPlayerState] = useState(-1);


    const [newVideoID, setNewVideoID] = useState('');

    const youtubePlayer = useRef<YT.Player>();

    const setVideoInformation = useCallback((video: Video) => {
        console.log('New Video', video);
        setVideoTitle(video.title);
        setVideoTime(video.timeStamp);
        setVideoDuration(video.duration);
        setVideoID(video.youtubeID);
        setPlaying(true);
    }, []);

    const addUser = useCallback((usr: User) => {
        setCurrentUsers((oldUsers) => {
            const usrs = [...oldUsers];
            usrs.push(usr);
            return usrs;
        });
    }, []);
    const removeUser = useCallback((usr: User) => {
        setCurrentUsers((oldUsers) => oldUsers.filter((u) => u.id !== usr.id));
    }, []);

    const getPlayer = useCallback((player: YT.Player) => {
        youtubePlayer.current = player;
        console.log(videoTime, playing);
        player.addEventListener('onStateChange', (e) => {
            setPlayerState(e.target.getPlayerState());
        });
        synchronizeYoutube(player, videoTime, playing);
    }, [videoTime, playing]);

    useEffect(() => {
        if (youtubePlayer.current) {
            synchronizeYoutube(youtubePlayer.current, videoTime, playing);
        }
    }, [videoTime, playing, playerState]);

    const newMessage = useCallback((msg: WSMessage) => {
        switch (msg.type) {
            case MessageType.Init:
                if (msg.Room) {
                    setRoomTitle(msg.Room.roomName);
                    setCurrentUsers(msg.Room.userList);
                    setVideoInformation(msg.Room.video);
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
            case MessageType.UserJoin:
                console.log('User Joined');
                break;
            case MessageType.UserLeft:
                console.log('User Left');
                break;
            default:
                console.warn('Invalid Websocket Type Received');
                break;
        }
    }, []);

    const ws = useWebsockets(roomID, newMessage);

    const togglePlay = (): void => {
        if (ws) ws.send(JSON.stringify({ type: playing ? MessageType.Pause : MessageType.Play }));
    };

    const submitNewVideo = (): void => {
        console.log(newVideoID);
        if (ws) ws.send(JSON.stringify({ type: MessageType.QueueAdd, data: newVideoID }));
    }

    const updateVideoID = (
        e: JSX.TargetedEvent<HTMLInputElement, Event>
    ): void => {
        setNewVideoID(e.currentTarget.value);
    };

    return (
        <div class={style.room}>
            <h1>{roomTitle}</h1>
            <h2>
                {videoTitle ? `Now Playing ${videoTitle}` : `Nothing Currently Playing`}
                <IconButton class={style.playButton} onClick={togglePlay}>{playing ? <Icon>pause_circle_outline</Icon> : <Icon>play_arrow</Icon>}</IconButton>
            </h2>
            <LinearProgress class={style.progress} progress={videoDuration && videoTime ? videoTime / videoDuration : 0} />
            <YouTubeVideo id={videoID} getPlayer={getPlayer} />
            <h2>Current Users:</h2>
            {currentUsers.map((usr) => (
                <Menu.Item>
                    {usr.name}
                </Menu.Item>
            ))}
            <h2>Set Video: (enter youtube ID)</h2>
            <TextField
                label="Video ID"
                value={newVideoID}
                onInput={updateVideoID}
            />
            <Button onClick={submitNewVideo}>Submit</Button>
        </div>
    );
}

export default Room;
