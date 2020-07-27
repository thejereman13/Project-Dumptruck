import { useRef, useEffect, useCallback } from "preact/hooks";
import { AuthInformation, VideoInformation, RoomInformation, UserInformation } from './InformationTypes';

export function useWebsockets(
    roomID: string,
    onLoadRoom: (newRoom: RoomInformation) => void,
    onLoadVideo: (newVideo: VideoInformation) => void,
    onSyncVideo: (time: number) => void,
    onSetDuration: (duration: number) => void,
    addUser: (usr: UserInformation) => void,
    removeUser: (usr: UserInformation) => void,
    onPlay: (playing: boolean) => void
    ): WebSocket | undefined {
    const ws = useRef<WebSocket>();

    const onMessage = useCallback((ev: MessageEvent) => {
        const message = ev.data as string;
        if (message.indexOf('auth') === 0) {
            const auth: AuthInformation = JSON.parse(message.substring(4));
            onLoadRoom(auth.room);
        } else if (message.indexOf('sync') === 0) {
            const time = JSON.parse(message.substring(4));
            onSyncVideo(Number(time.time));
        } else if (message.indexOf('seek') === 0) {
            const time = JSON.parse(message.substring(4));
            console.log('Time shifted to ', Number(time.time));
        }else if (message.indexOf('loadVideo') === 0) {
            const vid: VideoInformation = JSON.parse(message.substring(9));
            onLoadVideo(vid);
        } else if (message.indexOf('setDuration') === 0) {
            const time = JSON.parse(message.substring(11));
            onSetDuration(Number(time.duration));
        } else if (message === 'pause') {
            onPlay(false);
        } else if (message === 'play') {
            onPlay(true);
        }else if (message.indexOf('removeUser') === 0) {
            const user: UserInformation = JSON.parse(message.substring(10));
            removeUser(user);
        } else if (message.indexOf('addUser') === 0) {
            const user: UserInformation = JSON.parse(message.substring(7));
            addUser(user);
        }

    }, []);

    useEffect(() => {
        console.log('start');
        let ping: NodeJS.Timeout;
        const continuousPing = () =>  {
            if (ws.current?.readyState === ws.current?.OPEN)
                ws.current?.send('ping');
            ping = setTimeout(() => continuousPing(), 4000);
        };
        if (ws.current === undefined) {
            ws.current = new WebSocket(`wss://sync-tube.de/ws/${roomID}`);
            ws.current.addEventListener('message', onMessage);
            ws.current.addEventListener('open', () => {
                console.log('WS Opened');
                continuousPing();
            });
            ws.current.addEventListener('error', (e) => console.log("WS Error: ", e));
            ws.current.addEventListener('close', (e) => {
                console.log("WS Closed", e);
                clearTimeout(ping);
            });
        }
        return () => {
            console.log('c');
            ws.current?.close();
            ws.current = undefined;
            clearTimeout(ping);
        }
    }, []);

    return ws.current;
}