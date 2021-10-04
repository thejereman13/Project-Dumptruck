import { h, JSX } from "preact";
import Button from "preact-mui/lib/button";
import { useEffect, useState } from "preact/hooks";
import { GetRoomPlaying, RemoveRecentRoom, RequestVideoPreview } from "../../utils/RestCalls";
import { VideoInfo } from "../../utils/YoutubeTypes";
import { useAbortController } from "../../utils/AbortController";
import MdRemoveCircle from "@meronex/icons/md/MdRemoveCircle";
import { Tooltip } from "../../components/Popup";
import { css } from "@linaria/core";

const style = {
    roomCard: css`
        color: var(--text-secondary);
        background-color: var(--dp4-surface);
        height: 20rem;
        width: 16rem;
        padding: 1rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        &:hover {
            background-color: var(--dp24-surface) !important;
        }
        &:focus {
            color: var(--text-secondary) !important;
            background-color: var(--dp4-surface) !important;
        }
        & > div {
            height: 100%;
            display: flex;
            flex-flow: column;
        }
        & span {
            color: var(--text-secondary-disabled);
            line-height: 1rem;
            margin-top: 0.5rem;
        }
        & h3 {
            margin: 0.5rem 0 0 0;
            text-align: left;
        }
        & p {
            margin: 0;
            text-align: left;
        }
        & * {
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
        }
    `,
    roomCardTitle: css`
        margin: 0;
        font-size: 1.5rem;
        padding-bottom: 0.25rem;
        color: var(--theme-primary-dark);
        border-bottom: 2px solid var(--theme-secondary-dark);
    `,
    roomCardPreview: css`
        margin-top: 1rem;
        & img {
            width: 100%;
        }
    `,    
    cardIcon: css`
        color: var(--theme-secondary);
        padding: 0.75rem;
        margin: 0.25rem 0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        margin-top: auto;
        margin-left: auto;
        &:hover {
            background: rgba(0, 0, 0, 0.2);
            color: var(--theme-secondary-light);
        }
        & > div {
            display: flex;
        }
    `,
}

export interface RoomCardProps {
    onClick: () => void;
    updateCallback?: () => void;
    name: string;
    roomID: number;
    showRemove?: boolean;
}

export function RoomCard(props: RoomCardProps): JSX.Element {
    const { name, onClick, roomID, showRemove, updateCallback } = props;

    const [playingPreview, setPlayingPreview] = useState<VideoInfo | null>(null);
    const [userCount, setUserCount] = useState<number>(0);

    const controller = useAbortController();

    useEffect(() => {
        GetRoomPlaying(roomID.toString(), controller).then((res) => {
            if (res !== null) {
                if (res.currentVideo)
                    RequestVideoPreview(res.currentVideo.youtubeID, controller).then(setPlayingPreview);
                setUserCount(res.userCount);
            }
        });
    }, [roomID, controller]);

    const removeRecent = (e: h.JSX.TargetedMouseEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.stopPropagation();
        RemoveRecentRoom(roomID).then(updateCallback);
    };

    return (
        <Button className={["mui-btn", style.roomCard].join(" ")} variant="flat" onClick={onClick}>
            <div>
                <h2 className={style.roomCardTitle}>{name}</h2>
                {userCount > 0 ? (
                    <span>{userCount > 1 ? `${userCount} Users` : "1 User"} in Room</span>
                ) : (
                    <span>Room is Empty</span>
                )}
                {playingPreview !== null ? (
                    <div className={style.roomCardPreview}>
                        <img src={playingPreview.thumbnailMaxRes.url.replace("hqdefault", "mqdefault")} />
                        <h3>Current Playing: </h3>
                        <p>{playingPreview.title}</p>
                    </div>
                ) : (
                    <div>
                        <p>Nothing Currently Playing</p>
                    </div>
                )}
                {showRemove ? (
                    <Tooltip
                        content="Remove from Recent"
                        options={{ placement: "bottom" }}
                        className={style.cardIcon}
                        onClick={removeRecent}
                    >
                        <MdRemoveCircle size="1.5rem" />
                    </Tooltip>
                ) : null}
            </div>
        </Button>
    );
}
