import { createEffect, createSignal, For, JSX } from "solid-js";
import { VideoCard } from "../../components/displayCards/VideoCard";
import { Video } from "../../utils/WebsocketTypes";
import { dndzone as dndZoneDirective } from "solid-dnd-directive";
import { debounce } from "@solid-primitives/scheduled";
import { TbTrash } from 'solid-icons/tb'
import { css } from "solid-styled-components";

const dndzone = dndZoneDirective;
void dndzone;

const style = {
    removeAllButton: css`
        float: right;
        color: var(--theme-secondary-light) !important;
        font-size: 1rem;
        margin: 0.5rem 1rem;
    `,
    editTitle: css`
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-height: 2.5rem;
        display: inline-block;
    `,
};

function uniqueArray<T extends Video>(arr: T[]): T[] {
    return arr.filter((elem, index) => arr.findIndex((e) => e.youtubeID === elem.youtubeID) === index);
}

interface VideoRowProps {
    vid: Video;
    removeVideo: (videoID: string) => void;
}

function VideoRow(props: VideoRowProps): JSX.Element {
    const clickRow = () => props.removeVideo(props.vid.youtubeID);

    return (
        <VideoCard
            videoID={props.vid.youtubeID}
            duration={props.vid.duration}
            enablePreview={false}
            actionComponent={
                <button class="btn btn-circle btn-ghost btn-secondary tooltip tooltip-left inline-flex" data-tip="Remove From Queue" onClick={clickRow}>
                    <TbTrash size="1.5rem" />
                </button>
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

export function EditModal(props: EditModalProps): JSX.Element {
    const [internalPlaylist, setInternalPlaylist] = createSignal<(Video & { id: string })[]>([]);
    createEffect(() => {
        setInternalPlaylist(uniqueArray(props.playlist.map((v) => ({ ...v, id: v.youtubeID }))));
    });

    const debouncedReorder = debounce(
        (newPlaylist: Video[]) => {
            props.updatePlaylist(props.userID, uniqueArray(newPlaylist));
        },
        600
    );

    const clearAll = (): void => {
        props.removeAll(props.userID);
    };

    const shuffleAll = (): void => {
        const array = [...props.playlist];
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * i);
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        props.updatePlaylist(props.userID, array);
    };

    const dndEvent = (e: any) => {
        const { items } = e.detail;
        setInternalPlaylist(uniqueArray(items) as any[]);
    };
    const dndFinalize = (e: any) => {
        const { items } = e.detail;
        debouncedReorder(items);
        setInternalPlaylist(uniqueArray(items) as any[]);
    }

    return (
        <div class="p-2 flex flex-col w-full">
            <div class="px-2 overflow-hidden text-ellipsis whitespace-nowrap inline-block text-xl min-h-8">
                {self ? "Editing Queue" : `Editing Queue for ${props.userName}`}
            </div>
            { /* @ts-ignore */ }
            <section use:dndzone={{items: internalPlaylist, flipDurationMs: 0 }} on:consider={dndEvent} on:finalize={dndFinalize}>
                <For each={internalPlaylist()}>
                    {(vid) => (
                        <div class="bg-neutral-800">
                            <VideoRow vid={vid} removeVideo={props.removeVideo} />
                        </div>
                    )}
                </For>
            </section>
            <div class="flex sticky bottom-0 bg-neutral-800 z-50">
                <button
                    classList={{ "btn btn-ghost btn-primary": true, [style.removeAllButton]: true }}
                    onClick={shuffleAll}
                >
                    Shuffle All
                </button>
                <button
                    classList={{ "btn btn-ghost btn-primary": true, [style.removeAllButton]: true }}
                    onClick={clearAll}
                >
                    Remove All
                </button>
            </div>
        </div>
    );
}
