import { h, JSX } from "preact";
import Button from "preact-mui/lib/button";
import { memo } from "preact/compat";
import { Tooltip } from "../../components/Popup";
import { VideoCard } from "../../components/VideoCard";
import { Video } from "../../utils/WebsocketTypes";

import * as style from "./style.css";

export interface EditModalProps {
    playlist: Video[];
    userID: string;
    self: boolean;
    userName: string;
    removeVideo: (videoID: string) => void;
}

export const EditModal = memo(
    function EditModal(props: EditModalProps): JSX.Element {
        const { playlist, self, userName, removeVideo } = props;

        return (
            <div class={style.ModalBox}>
                <div class="mui--text-headline">{self ? "Editing Queue" : `Editing Queue for ${userName}`}</div>
                <div class={style.scrollBox}>
                    {playlist.map(vid => (
                        <VideoCard
                            key={vid.youtubeID}
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
                    ))}
                </div>
            </div>
        );
    },
    (prev: EditModalProps, next: EditModalProps) => {
        return prev.userID === next.userID && prev.playlist === next.playlist;
    }
);
