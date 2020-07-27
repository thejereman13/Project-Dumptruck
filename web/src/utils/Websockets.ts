import { useRef, useEffect, useCallback } from "preact/hooks";
import { WSMessage } from "./WebsocketTypes";



function getBaseURL() {
    if (process.env.NODE_ENV !== 'production') {
        return "wss://localhost:8000";
    } else {
        return "wss://" + window.location.host;
    }
}

export function useWebsockets(
    roomID: string,
    messageCallback: (data: WSMessage) => void,
    ): WebSocket | undefined {
    const ws = useRef<WebSocket>();

    const onMessage = useCallback((ev: MessageEvent) => {
        const message = JSON.parse(ev.data) as WSMessage;
        messageCallback(message);
    }, []);

    useEffect(() => {
        console.log('start');
        let ping: NodeJS.Timeout;
        const continuousPing = () =>  {
            if (ws.current?.readyState === ws.current?.OPEN)
                ws.current?.send(JSON.stringify({
                    type: 'ping'
                }));
            ping = setTimeout(() => continuousPing(), 4000);
        };
        if (ws.current === undefined) {
            ws.current = new WebSocket(`${getBaseURL()}/ws?${roomID}`);
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