import { createEffect, createSignal, For, JSX, onMount, Show } from "solid-js";
import { css } from "solid-styled-components";
import { RoomCard } from "./components/displayCards/RoomCard";
import { RegisterNotification } from "./components/Notification";
import { siteUser } from "./Login";
import { useAbortController } from "./utils/AbortController";
import { RoomInfo } from "./utils/BackendTypes";
import { CreateNewRoom, GetActiveRooms, GetRoomInfo } from "./utils/RestCalls";

const style = {
    home: css`
        padding: 0 20px;
        margin-top: var(--navbar-height);
        height: 100%;
        overflow-y: auto;
        width: 100%;
    `,
};

export function Home(): JSX.Element {
    const [roomInfo, setRoomInfo] = createSignal<RoomInfo[]>([]);
    const [publicRooms, setPublicRooms] = createSignal<RoomInfo[]>([]);

    const controller = useAbortController();

    onMount(() => {
        GetActiveRooms(controller).then((res) => {
            Promise.all(res.map(async (a) => await GetRoomInfo(controller, a.toString()))).then((results) => {
                if (!controller.signal.aborted)
                    setPublicRooms(
                        results.reduce((arr: RoomInfo[], current: RoomInfo | null) => {
                            if (current) arr.push(current);
                            return arr;
                        }, [])
                    );
            });
        });
    });

    createEffect(() => {
        const user = siteUser();
        if (user) {
            Promise.all(user.recentRooms.map(async (a) => await GetRoomInfo(controller, a.toString()))).then(
                (results) => {
                    if (!controller.signal.aborted)
                        setRoomInfo(
                            results.reduce((arr: RoomInfo[], current: RoomInfo | null) => {
                                if (current) arr.push(current);
                                return arr;
                            }, [])
                        );
                }
            );
        }
    });

    const adminRooms = () =>
        siteUser() !== null
            ? roomInfo()
                  .filter((r) => r.admins.includes(siteUser()!.id))
                  .reverse()
            : [];
    const userRooms = () =>
        siteUser() !== null
            ? siteUser()!
                  .recentRooms.map((id) => roomInfo().find((r) => r.roomID == id && !r.admins.includes(siteUser()!.id)))
                  .reduce((arr: RoomInfo[], current: RoomInfo | undefined) => {
                      if (current) arr.push(current);
                      return arr;
                  }, [])
                  .reverse()
            : [];
    const filteredPublicRooms = () =>
        publicRooms().filter(
            (r) =>
                r.settings.publicVisibility &&
                !adminRooms().some((a) => a.roomID === r.roomID) &&
                !userRooms().some((u) => u.roomID === r.roomID)
        );

    const createRoom = (): void => {
        CreateNewRoom().then((res) => {
            if (res !== null) {
                window.location.href = `/room/${res}`;
            } else {
                RegisterNotification("Failed to Create Room", "error");
            }
        });
    };

    return (
        <div class={style.home}>
            <Show when={siteUser() !== null}>
                <div>
                    {adminRooms().length > 0 ? (
                        <div class="flex flex-col">
                            <h2 class="text-2xl font-bold mt-4">Your Rooms</h2>
                            <div class="flex flex-row flex-wrap">
                                <For each={adminRooms()}>
                                    {(room) => (
                                        <RoomCard
                                            roomID={room.roomID}
                                            name={room.settings.name}
                                            href={`/room/${room.roomID}`}
                                        />
                                    )}
                                </For>
                            </div>
                        </div>
                    ) : null}
                    {userRooms().length > 0 ? (
                        <div class="m-2">
                            <h2 class="text-2xl font-bold mt-4">Recent Rooms</h2>
                            <div class="flex flex-row flex-wrap">
                                <For each={userRooms()}>
                                    {(room) => (
                                        <RoomCard
                                            showRemove
                                            roomID={room.roomID}
                                            name={room.settings.name}
                                            href={`/room/${room.roomID}`}
                                        />
                                    )}
                                </For>
                            </div>
                        </div>
                    ) : null}
                </div>
            </Show>
            <Show when={filteredPublicRooms().length > 0}>
                <div class="m-2">
                    <h2 class="text-2xl font-bold mt-4">Public Rooms</h2>
                    <div class="flex flex-row flex-wrap">
                        <For each={publicRooms()}>
                            {(room) => (
                                <RoomCard
                                    roomID={room.roomID}
                                    name={room.settings.name}
                                    href={`/room/${room.roomID}`}
                                />
                            )}
                        </For>
                    </div>
                </div>
            </Show>
            <Show when={siteUser()?.id}>
                <button class="btn btn-primary mt-4 ml-4" onClick={createRoom}>
                    Create New Room
                </button>
            </Show>
        </div>
    );
}
