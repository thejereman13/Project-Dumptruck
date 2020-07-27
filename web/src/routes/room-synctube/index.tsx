import { h, JSX } from "preact";
import LinearProgress from "preact-material-components/LinearProgress";
import Icon from "preact-material-components/Icon";
import IconButton from "preact-material-components/IconButton";
import * as style from './style.css';
import { useWebsockets as useSynctubeWebsocket } from "../../utils/synctube/Websocket";
import { useCallback, useState, useRef, useEffect } from "preact/hooks";
import { RoomInformation, UserInformation, VideoInformation } from "../../utils/synctube/InformationTypes";
import Menu from "preact-material-components/Menu";
import YouTubeVideo from "../../components/YTPlayer";
import { useWebsockets } from "../../utils/Websockets";

export interface RoomProps {
    roomID: string;
}

function synchronizeYoutube(player: YT.Player, videoTime: number, playing: boolean) {
    if (Math.abs(player.getCurrentTime() - videoTime) > 1) {
        player.seekTo(videoTime, true);
    }
    if (player.getPlayerState() !== 2 && !playing) {
        player.pauseVideo();
        console.log('pause');
    } else if (player.getPlayerState() !== 1 && playing) {
        player.playVideo();
        console.log('play');
    }
}

function Room({ roomID }: RoomProps) {

    const [videoTitle, setVideoTitle] = useState('');
    const [videoID, setVideoID] = useState('');
    const [videoDuration, setVideoDuration] = useState(0);
    const [videoTime, setVideoTime] = useState(0);
    const [currentUsers, setCurrentUsers] = useState<UserInformation[]>([]);
    const [playing, setPlaying] = useState(false);
    const [playerState, setPlayerState] = useState(-1);

    const youtubePlayer = useRef<YT.Player>();

    const loadVideo = useCallback((vid: VideoInformation) => {
        console.log(vid);
        setVideoTitle(vid.title);
        setVideoID(vid.id);
    }, []);
    const loadRoom = useCallback((room: RoomInformation) => {
        if (room.player.video) {
            setVideoDuration(room.player.video.duration);
            setVideoTime(room.player.time);
            setVideoTitle(room.player.video.title);
            setVideoID(room.player.video.id);
            setPlaying(room.player.playing);
        }
        setCurrentUsers(room.users);
    }, []);
    const addUser = useCallback((usr: UserInformation) => {
        setCurrentUsers((oldUsers) => {
            const usrs = [...oldUsers];
            usrs.push(usr);
            return usrs;
        });
    }, []);
    const removeUser = useCallback((usr: UserInformation) => {
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


    const ws = useSynctubeWebsocket(roomID, loadRoom, loadVideo, setVideoTime, setVideoDuration, addUser, removeUser, setPlaying);

    const newMessage = useCallback((msg: string) => {
        console.log(msg);
    }, []);

    const togglePlay = (): void => {
        if (ws) ws.send(playing ? 'pause' : 'play');
    };

    return (
        <div class={style.room}>
            <h1>Joined Room {roomID}</h1>
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
            <iframe height={0} style={{ borderWidth: 0 }} src={`https://sync-tube.de/rooms/${roomID}`} sandbox=""></iframe>
        </div>
    );
}

export default Room;
