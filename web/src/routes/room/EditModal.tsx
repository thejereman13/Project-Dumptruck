import { h, JSX } from "preact";
import Button from "preact-mui/lib/button";
import { memo, Ref, useEffect, useState } from "preact/compat";
import { Tooltip } from "../../components/Popup";
import { VideoCard } from "../../components/displayCards/VideoCard";
import { Video } from "../../utils/WebsocketTypes";
import { arrayMove, List } from "react-movable";
import * as style from "./style.css";
import { useDebouncedCallback } from "use-debounce-preact";

interface VideoRowProps {
    vid: Video;
    removeVideo: (videoID: string) => void;
}

function VideoRow(props: VideoRowProps): JSX.Element {
    const { vid, removeVideo } = props;
    return (
        <VideoCard
            videoID={vid.youtubeID}
            duration={vid.duration}
            actionComponent={
                <Tooltip content="Remove From Queue">
                    <Button size="small" variant="fab" onClick={(): void => removeVideo(vid.youtubeID)}>
                        <i style={{ fontSize: "24px" }} class="material-icons">
                            delete
                        </i>
                    </Button>
                </Tooltip>
            }
        />
    );
}

export interface EditModalProps {
    playlist: Video[];
    userID: string;
    self: boolean;
    userName: string;
    removeVideo: (videoID: string) => void;
    removeAll: (id: string) => void;
    closeCallback: Ref<() => void>;
    updatePlaylist: (userID: string, playlist: Video[]) => void;
}

export const EditModal = memo(
    function EditModal(props: EditModalProps): JSX.Element {
        const { playlist, self, userName, userID, removeVideo, removeAll, updatePlaylist, closeCallback } = props;

        const [internalPlaylist, setInternalPlaylist] = useState<Video[]>(playlist);
        useEffect(() => {
            setInternalPlaylist(playlist);
        }, [playlist]);

        const [debouncedReorder, , debouncedFlush] = useDebouncedCallback(
            (newPlaylist: Video[]) => {
                updatePlaylist(userID, newPlaylist);
            },
            1600,
            [userID]
        );

        closeCallback.current = (): void => {
            debouncedFlush();
        };

        const clearAll = (): void => {
            removeAll(userID);
            document.location.href = "#";
            closeCallback.current();
        };

        return (
            <div class={style.ModalBox}>
                <div class="mui--text-headline">
                    {self ? "Editing Queue" : `Editing Queue for ${userName}`}
                    <Button
                        className={["mui-btn", "mui-btn--flat", style.removeAllButton].join(" ")}
                        variant="flat"
                        onClick={clearAll}
                    >
                        Remove All
                    </Button>
                </div>
                <List
                    values={internalPlaylist}
                    onChange={({ oldIndex, newIndex }): void => {
                        const newArr = arrayMove(internalPlaylist, oldIndex, newIndex);
                        debouncedReorder(newArr);
                        setInternalPlaylist(newArr);
                    }}
                    renderList={({ children, props }): JSX.Element => (
                        <div {...props} className={style.scrollBox}>
                            {children}
                        </div>
                    )}
                    renderItem={({ value, props, isDragged }): JSX.Element => (
                        <div
                            key={value.youtubeID}
                            {...(props as any)}
                            style={{
                                ...props.style,
                                zIndex: 2048,
                                cursor: isDragged ? "grabbing" : "grab"
                            }}
                            className={style.EditCard}
                        >
                            <VideoRow vid={value} removeVideo={removeVideo} />
                        </div>
                    )}
                />
            </div>
        );
    },
    (prev: EditModalProps, next: EditModalProps) => {
        return prev.userID === next.userID && prev.playlist === next.playlist;
    }
);
