import { RoomSettings, YoutubeVideoInformation } from "../../utils/BackendTypes";
import { useWebsockets } from "../../utils/Websockets";
import { MessageType, WSMessage } from "../../utils/WebsocketTypes";
import { RegisterNotification } from "../Notification";


const WSErrorMessage = (): void => {
    RegisterNotification("Failed to Connect to Server", "error");
};

export interface RoomWebsocketCallbacks {
    ws: WebSocket | null;
    addAdmin: (id: string) => void;
    removeAdmin: (id: string) => void;
    removeAllVideos: (id: string) => void;
    removeVideo: (id: string) => void;
    reorderQueue: (id: string, videos: YoutubeVideoInformation[]) => void;
    skipVideo: () => void;
    seekVideo: (time: number) => void;
    submitAllVideos: (newVideos: YoutubeVideoInformation[], playlistTitle: string) => void;
    submitVideoFront: (newVideo: YoutubeVideoInformation, videoTitle: string) => void;
    submitVideoBack: (newVideo: YoutubeVideoInformation, videoTitle: string) => void;
    togglePlay: (playing: boolean) => void;
    updateSettings: (settings: RoomSettings) => void;
    logError: (id: string) => void;
    logReady: () => void;
}

const useCallback = (f: any) => f;

export function useRoomWebsockets(roomID: string, newMessage: (msg: WSMessage) => void): RoomWebsocketCallbacks {
    const ws = useWebsockets(roomID, newMessage);

    const togglePlay = (playing: boolean): void => {
        if (ws) {
            ws.send(
                JSON.stringify({
                    t: playing ? MessageType.Pause : MessageType.Play
                })
            );
        } else {
            WSErrorMessage();
        }
    };
    const skipVideo = (): void => {
        if (ws) ws.send(JSON.stringify({ t: MessageType.Skip }));
    };
    const seekVideo =  (time: number): void => {
        if (ws) ws.send(JSON.stringify({ t: MessageType.Seek, d: Math.floor(time) }));
    };

    const submitVideoFront =  (newVideo: YoutubeVideoInformation, videoTitle = ""): void => {
        if (ws) {
            ws.send(JSON.stringify({ t: MessageType.QueueAddFront, d: newVideo }));
            RegisterNotification(`Queued ${videoTitle.length > 0 ? videoTitle : "Video"}`, "info");
        } else {
            WSErrorMessage();
        }
    };
    const submitVideoBack =  (newVideo: YoutubeVideoInformation, videoTitle = ""): void => {
        if (ws) {
            ws.send(JSON.stringify({ t: MessageType.QueueAddBack, d: newVideo }));
            RegisterNotification(`Queued ${videoTitle.length > 0 ? videoTitle : "Video"}`, "info");
        } else {
            WSErrorMessage();
        }
    };
    const submitAllVideos =  (newVideos: YoutubeVideoInformation[], playlistTitle: string): void => {
        if (ws) {
            ws.send(JSON.stringify({ t: MessageType.QueueMultiple, d: newVideos }));
            RegisterNotification(
                `Queued All Videos from ${playlistTitle.length > 0 ? playlistTitle : "Playlist"}`,
                "info"
            );
        } else {
            WSErrorMessage();
        }
    };
    const removeVideo =  (id: string): void => {
        if (ws) {
            ws.send(JSON.stringify({ t: MessageType.QueueRemove, d: id }));
        } else {
            WSErrorMessage();
        }
    };
    const removeAllVideos =  (userID: string): void => {
        if (ws) {
            ws.send(JSON.stringify({ t: MessageType.QueueClear, d: userID }));
        } else {
            WSErrorMessage();
        }
    };
    const updateSettings =  (settings: RoomSettings): void => {
        if (ws) {
            ws.send(JSON.stringify({ t: MessageType.RoomSettings, d: settings }));
        } else {
            WSErrorMessage();
        }
    };
    const removeAdmin =  (id: string): void => {
        if (ws) {
            ws.send(JSON.stringify({ t: MessageType.AdminRemove, d: id }));
        } else {
            WSErrorMessage();
        }
    };
    const addAdmin =  (id: string): void => {
        if (ws) {
            ws.send(JSON.stringify({ t: MessageType.AdminAdd, d: id }));
        } else {
            WSErrorMessage();
        }
    };
    const reorderQueue =  (id: string, videos: YoutubeVideoInformation[]): void => {
        if (ws) {
            ws.send(JSON.stringify({ t: MessageType.QueueReorder, d: videos, target: id }));
        } else {
            WSErrorMessage();
        }
    };

    const logError =  (id: string): void => {
        if (ws) ws.send(JSON.stringify({ t: MessageType.UserError, d: id }));
    };
    const logReady = (): void => {
        if (ws) ws.send(JSON.stringify({ t: MessageType.UserReady }));
    };

    return {
        ws,
        addAdmin,
        removeAdmin,
        removeAllVideos,
        removeVideo,
        reorderQueue,
        skipVideo,
        seekVideo,
        submitAllVideos,
        submitVideoBack,
        submitVideoFront,
        togglePlay,
        updateSettings,
        logError,
        logReady
    };
}
