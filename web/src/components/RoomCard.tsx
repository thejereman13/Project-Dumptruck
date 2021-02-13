import { h, JSX } from "preact";
import Button from "preact-mui/lib/button";
import { useEffect, useState } from "preact/hooks";
import { GetRoomPlaying, RequestVideoPreview } from "../utils/RestCalls";
import { VideoInfo } from "../utils/YoutubeTypes";
import { useAbortController } from "./AbortController";

import * as style from "./style.css";

export interface RoomCardProps {
    onClick: () => void;
    name: string;
    roomID: number;
}

export function RoomCard(props: RoomCardProps): JSX.Element {
    const { name, onClick, roomID } = props;

    const [playingPreview, setPlayingPreview] = useState<VideoInfo | null>(null);

    const controller = useAbortController();

    useEffect(() => {
        GetRoomPlaying(roomID.toString(), controller).then(res => {
            if (res !== null) {
                RequestVideoPreview(res.youtubeID, controller).then(setPlayingPreview);
            }
        });
    }, [roomID, controller]);

    return (
        <Button className={["mui-btn", style.RoomCard].join(" ")} variant="flat" onClick={onClick}>
            <div>
                <h2 className={style.RoomCardTitle}>{name}</h2>
                {playingPreview !== null ? (
                    <div className={style.RoomCardPreview}>
                        <img
                            class={style.VideoIcon}
                            src={playingPreview.thumbnailMaxRes.url.replace("hqdefault", "mqdefault")}
                        />
                        <h3>Current Playing: </h3>
                        <p>{playingPreview.title}</p>
                    </div>
                ) : (
                    <div>
                        <p>Nothing Currently Playing</p>
                    </div>
                )}
            </div>
        </Button>
    );
}
