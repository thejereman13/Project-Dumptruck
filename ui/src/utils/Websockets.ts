import { MessageType, WSMessage } from "./WebsocketTypes";
import { RegisterNotification } from "../components/Notification";
import { onCleanup } from "solid-js";

function getBaseURL(): string {
    if (process.env.NODE_ENV !== "production") {
        return "wss://" + window.location.host;
    } else {
        return "wss://" + window.location.host;
    }
}

const WS_MAX_TRIES = 15;

export function useWebsockets(roomID: string, messageCallback: (data: WSMessage) => void): WebSocket | null {
    let ws: WebSocket | null = null;
    let ping: NodeJS.Timeout | null = null;
    let wsAttemptCounter: number = 0;

    const closeWSSession = (ev: BeforeUnloadEvent | null): undefined => {
        ws?.close();
        ws = null;
        if (ev) delete ev["returnValue"];
        return undefined;
    };

    const continuousPing = (): void => {
        if (ws?.readyState === ws?.OPEN)
            ws?.send(
                JSON.stringify({
                    t: "ping"
                })
            );
    };

    const onMessage = (ev: MessageEvent) => {
        const message = JSON.parse(ev.data) as WSMessage;
        wsAttemptCounter = 0;
        if (message.t === MessageType.Ping) {
            ping = setTimeout(() => continuousPing(), 8000);
        }
        messageCallback(message);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    };

    let websocketMounted = true;
    
    const createWebSocket = (): void => {
        wsAttemptCounter += 1;
        if (wsAttemptCounter > WS_MAX_TRIES) {
            console.error("Failed to Open Websocket for Room ", roomID);
            RegisterNotification("Lost Connection to Server", "error");
            return;
        }
        if (!websocketMounted) return;

        ws = new WebSocket(`${getBaseURL()}/api/ws?room=${roomID}`);
        ws.addEventListener("message", onMessage);
        ws.addEventListener("open", () => {
            ping = setTimeout(() => continuousPing(), 8000);
        });
        ws.addEventListener("error", (e) => console.warn("WS Error: ", e));
        ws.addEventListener("close", () => {
            if (ping)
                clearTimeout(ping);
            setTimeout(() => createWebSocket(), 800);
        });
    };
    if (ws === null) {
        createWebSocket();
    }

    // When the page unloads/refreshes, attempt to remove the user from backend
    // This fixes refreshes adding to the user count
    window.onbeforeunload = closeWSSession;

    onCleanup(() => {
        closeWSSession(null);
        if (ping)
            clearTimeout(ping);
        websocketMounted = false;
    });

    return ws;
}
