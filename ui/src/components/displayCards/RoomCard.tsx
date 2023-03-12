import { IoRemoveCircle } from "solid-icons/io";
import { createEffect, createSignal, JSX, Show } from "solid-js";
import { refreshSiteUser } from "../../Login";
import { useAbortController } from "../../utils/AbortController";
import { GetRoomPlaying, RemoveRecentRoom, RequestVideoPreview } from "../../utils/RestCalls";
import { VideoInfo } from "../../utils/YoutubeTypes";

export interface RoomCardProps {
    href: string;
    name: string;
    roomID: number;
    showRemove?: boolean;
}

export function RoomCard(props: RoomCardProps): JSX.Element {
    const [playingPreview, setPlayingPreview] = createSignal<VideoInfo | null>(null);
    const [userCount, setUserCount] = createSignal<number>(0);

    const controller = useAbortController();

    createEffect(() => {
        GetRoomPlaying(controller, props.roomID.toString()).then((res) => {
            if (res !== null) {
                if (res.currentVideo)
                    RequestVideoPreview(controller, res.currentVideo.youtubeID).then(setPlayingPreview);
                setUserCount(res.userCount);
            }
        });
    });

    const removeRecent: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (e) => {
        e.preventDefault();
        e.stopPropagation();
        RemoveRecentRoom(props.roomID).then(refreshSiteUser);
    };

    return (
        <a class="card m-2 cursor-pointer overflow-hidden max-w-sm" href={props.href}>
            <div class="card-body bg-neutral-800 hover:bg-neutral-700 rounded-md p-6">
                <h2 class="card-title text-primary text-2xl font-medium">{props.name}</h2>
                <Show when={playingPreview()} fallback={<div><p>Nothing Currently Playing</p></div>}>
                    {(playing) => (
                        <div>
                            <h4 class="font-semibold text-lg">Current Playing: </h4>
                            <img src={playing.thumbnailMaxRes.url.replace("hqdefault", "mqdefault")} />
                            <p class="overflow-ellipsis overflow-hidden whitespace-nowrap">
                                {playing.title}
                            </p>
                        </div>
                    )}
                </Show>
                <Show when={userCount() > 0} fallback={<span class="text-neutral-500 text-sm">Room is Empty</span>}>
                    <span class="text-neutral-500 text-sm">{userCount() > 1 ? `${userCount()} Users` : "1 User"} in Room</span>
                </Show>
                <Show when={props.showRemove}>
                    <button
                        class="btn btn-circle btn-primary ml-auto btn-ghost inline-flex tooltip tooltip-bottom"
                        data-tip="Remove"
                        onClick={removeRecent}
                    >
                        <IoRemoveCircle size="1.5rem" />
                    </button>
                </Show>
            </div>
        </a>
    );
}
