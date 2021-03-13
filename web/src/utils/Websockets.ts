import { useRef, useEffect, useCallback } from "preact/hooks";
import { WSMessage } from "./WebsocketTypes";
import { RegisterNotification } from "../components/Notification";

function getBaseURL(): string {
    if (process.env.NODE_ENV !== "production") {
        return "wss://localhost:8000";
    } else {
        return "wss://" + window.location.host;
    }
}

const WS_MAX_TRIES = 5;

export function useWebsockets(roomID: string, messageCallback: (data: WSMessage) => void): WebSocket | null {
    const ws = useRef<WebSocket | null>(null);
    const wsAttemptCounter = useRef<number>(0);

    const closeWSSession = useCallback((ev: BeforeUnloadEvent | null): undefined => {
        ws.current?.close();
        ws.current = null;
        if (ev) delete ev["returnValue"];
        return undefined;
    }, []);

    const onMessage = useCallback((ev: MessageEvent) => {
        const message = JSON.parse(ev.data) as WSMessage;
        wsAttemptCounter.current = 0;
        messageCallback(message);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let websocketMounted = true;
        let ping: NodeJS.Timeout;
        const continuousPing = (): void => {
            if (ws.current?.readyState === ws.current?.OPEN)
                ws.current?.send(
                    JSON.stringify({
                        t: "ping"
                    })
                );
            ping = setTimeout(() => continuousPing(), 4000);
        };
        const createWebSocket = (): void => {
            wsAttemptCounter.current += 1;
            if (wsAttemptCounter.current > WS_MAX_TRIES) {
                console.error("Failed to Open Websocket for Room ", roomID);
                RegisterNotification("Lost Connection to Server", "error");
                return;
            }
            if (!websocketMounted) return;

            ws.current = new WebSocket(`${getBaseURL()}/api/ws?room=${roomID}`);
            ws.current.addEventListener("message", onMessage);
            ws.current.addEventListener("open", () => {
                continuousPing();
            });
            ws.current.addEventListener("error", e => console.warn("WS Error: ", e));
            ws.current.addEventListener("close", () => {
                clearTimeout(ping);
                createWebSocket();
            });
        };
        if (ws.current === null) {
            createWebSocket();
        }

        // When the page unloads/refreshes, attempt to remove the current user from backend
        // This fixes refreshes adding to the user count
        window.onbeforeunload = closeWSSession;

        return (): void => {
            closeWSSession(null);
            clearTimeout(ping);
            websocketMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return ws.current;
}
