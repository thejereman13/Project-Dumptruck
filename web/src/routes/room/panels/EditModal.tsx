import { h, JSX } from "preact";
import Button from "preact-mui/lib/button";
import { memo, useEffect, useState } from "preact/compat";
import { Tooltip } from "../../../components/Popup";
import { VideoCard } from "../../../components/displayCards/VideoCard";
import { Video } from "../../../utils/WebsocketTypes";
import { arrayMove, List } from "react-movable";
import { useDebouncedCallback } from "use-debounce-preact";

import * as style from "./EditModal.css";
import MdTrash from "@meronex/icons/ios/MdTrash";

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
            enablePreview={false}
            actionComponent={
                <Tooltip content="Remove From Queue">
                    <Button size="small" variant="fab" onClick={(): void => removeVideo(vid.youtubeID)}>
                        <MdTrash size="1.5rem" />
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
    updatePlaylist: (userID: string, playlist: Video[]) => void;
}

export const EditModal = memo(
    function EditModal(props: EditModalProps): JSX.Element {
        const { playlist, self, userName, userID, removeVideo, removeAll, updatePlaylist } = props;

        const [internalPlaylist, setInternalPlaylist] = useState<Video[]>(playlist);
        useEffect(() => {
            setInternalPlaylist(playlist);
        }, [playlist]);

        const [debouncedReorder] = useDebouncedCallback(
            (newPlaylist: Video[]) => {
                updatePlaylist(userID, newPlaylist);
            },
            1600,
            [userID]
        );

        const clearAll = (): void => {
            removeAll(userID);
        };

        const shuffleAll = (): void => {
            const array = [...playlist];
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * i);
                const temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            updatePlaylist(userID, array);
        };

        return (
            <div class={style.editContainer}>
                <div class={[style.editTitle, "mui--text-headline"].join(" ")}>
                    {self ? "Editing Queue" : `Editing Queue for ${userName}`}
                </div>
                <List
                    values={internalPlaylist}
                    onChange={({ oldIndex, newIndex }): void => {
                        const newArr = arrayMove(internalPlaylist, oldIndex, newIndex);
                        debouncedReorder(newArr);
                        setInternalPlaylist(newArr);
                    }}
                    renderList={({ children, props }): JSX.Element => (
                        <div {...props} className={style.editList}>
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
                            className={style.editCard}
                        >
                            <VideoRow vid={value} removeVideo={removeVideo} />
                        </div>
                    )}
                />
                <div>
                    <Button
                        className={["mui-btn", "mui-btn--flat", style.removeAllButton].join(" ")}
                        variant="flat"
                        onClick={shuffleAll}
                    >
                        Shuffle All
                    </Button>
                    <Button
                        className={["mui-btn", "mui-btn--flat", style.removeAllButton].join(" ")}
                        variant="flat"
                        onClick={clearAll}
                    >
                        Remove All
                    </Button>
                </div>
            </div>
        );
    },
    (prev: EditModalProps, next: EditModalProps) => {
        return prev.userID === next.userID && prev.playlist === next.playlist;
    }
);
