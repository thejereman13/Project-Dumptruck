import { useCallback } from "preact/hooks";
import { RegisterNotification } from "../../components/Notification";
import { RoomSettings, YoutubeVideoInformation } from "../../utils/BackendTypes";
import { useWebsockets } from "../../utils/Websockets";
import { MessageType, WSMessage } from "../../utils/WebsocketTypes";

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
    submitAllVideos: (newVideos: YoutubeVideoInformation[], playlistTitle: string) => void;
    submitVideoFront: (newVideo: YoutubeVideoInformation, videoTitle: string) => void;
    submitVideoBack: (newVideo: YoutubeVideoInformation, videoTitle: string) => void;
    togglePlay: (playing: boolean) => void;
    updateSettings: (settings: RoomSettings) => void;
    logError: (id: string) => void;
    logReady: () => void;
}

export function useRoomWebsockets(roomID: string, newMessage: (msg: WSMessage) => void): RoomWebsocketCallbacks {
    const ws = useWebsockets(roomID, newMessage);

    const togglePlay = useCallback(
        (playing: boolean): void => {
            if (ws)
                ws.send(
                    JSON.stringify({
                        t: playing ? MessageType.Pause : MessageType.Play
                    })
                );
            else {
                WSErrorMessage();
            }
        },
        [ws]
    );
    const skipVideo = useCallback((): void => {
        if (ws) ws.send(JSON.stringify({ t: MessageType.Skip }));
    }, [ws]);

    const submitVideoFront = useCallback(
        (newVideo: YoutubeVideoInformation, videoTitle = ""): void => {
            if (ws) {
                ws.send(JSON.stringify({ t: MessageType.QueueAddFront, d: newVideo }));
                RegisterNotification(`Queued ${videoTitle.length > 0 ? videoTitle : "Video"}`, "info");
            } else {
                WSErrorMessage();
            }
        },
        [ws]
    );
    const submitVideoBack = useCallback(
        (newVideo: YoutubeVideoInformation, videoTitle = ""): void => {
            if (ws) {
                ws.send(JSON.stringify({ t: MessageType.QueueAddBack, d: newVideo }));
                RegisterNotification(`Queued ${videoTitle.length > 0 ? videoTitle : "Video"}`, "info");
            } else {
                WSErrorMessage();
            }
        },
        [ws]
    );
    const submitAllVideos = useCallback(
        (newVideos: YoutubeVideoInformation[], playlistTitle: string): void => {
            if (ws) {
                ws.send(JSON.stringify({ t: MessageType.QueueMultiple, d: newVideos }));
                RegisterNotification(
                    `Queued All Videos from ${playlistTitle.length > 0 ? playlistTitle : "Playlist"}`,
                    "info"
                );
            } else {
                WSErrorMessage();
            }
        },
        [ws]
    );
    const removeVideo = useCallback(
        (id: string): void => {
            if (ws) {
                ws.send(JSON.stringify({ t: MessageType.QueueRemove, d: id }));
            } else {
                WSErrorMessage();
            }
        },
        [ws]
    );
    const removeAllVideos = useCallback(
        (userID: string): void => {
            if (ws) {
                ws.send(JSON.stringify({ t: MessageType.QueueClear, d: userID }));
            } else {
                WSErrorMessage();
            }
        },
        [ws]
    );
    const updateSettings = useCallback(
        (settings: RoomSettings): void => {
            if (ws) {
                ws.send(JSON.stringify({ t: MessageType.RoomSettings, d: settings }));
            } else {
                WSErrorMessage();
            }
        },
        [ws]
    );
    const removeAdmin = useCallback(
        (id: string): void => {
            if (ws) {
                ws.send(JSON.stringify({ t: MessageType.AdminRemove, d: id }));
            } else {
                WSErrorMessage();
            }
        },
        [ws]
    );
    const addAdmin = useCallback(
        (id: string): void => {
            if (ws) {
                ws.send(JSON.stringify({ t: MessageType.AdminAdd, d: id }));
            } else {
                WSErrorMessage();
            }
        },
        [ws]
    );

    const reorderQueue = useCallback(
        (id: string, videos: YoutubeVideoInformation[]): void => {
            if (ws) {
                ws.send(JSON.stringify({ t: MessageType.QueueReorder, d: videos, target: id }));
            } else {
                WSErrorMessage();
            }
        },
        [ws]
    );

    const logError = useCallback(
        (id: string): void => {
            if (ws) ws.send(JSON.stringify({ t: MessageType.UserError, d: id }));
        },
        [ws]
    );
    const logReady = useCallback((): void => {
        if (ws) ws.send(JSON.stringify({ t: MessageType.UserReady }));
    }, [ws]);

    return {
        ws,
        addAdmin,
        removeAdmin,
        removeAllVideos,
        removeVideo,
        reorderQueue,
        skipVideo,
        submitAllVideos,
        submitVideoBack,
        submitVideoFront,
        togglePlay,
        updateSettings,
        logError,
        logReady
    };
}
