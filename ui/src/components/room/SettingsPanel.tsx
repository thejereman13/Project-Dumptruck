import { createEffect, createSignal, For, JSX, Show } from "solid-js";
import { RoomInfo, SiteUser } from "../../utils/BackendTypes";
import { GetAnyUser } from "../../utils/RestCalls";
import { useAbortController } from "../../utils/AbortController";

import { TbTrash } from "solid-icons/tb";
import { style as commonStyle } from "../../components/sharedStyle";
import { css } from "solid-styled-components";

const style = {
    settingContainer: css`
        padding: 1rem;
        display: flex;
        flex-direction: column;
        width: 32rem;
        margin: 0 auto;
    `,
    settingFullWidth: css`
        width: 100%;
        display: flex;
        flex-direction: column;
    `,
    settingTrimField: css`
        display: inline-flex;
        & > div {
            padding: 0;
            margin-bottom: 0;
            width: 8rem;
        }
    `,
    settingTrimLabel: css`
        display: inline-flex;
        margin-right: 1rem;
    `,
    settingRemoveIcon: css`
        font-size: 1.5rem;
        color: var(--theme-secondary);
    `,
    settingUserRow: css`
        display: flex;
        margin: 0.25rem 0;
        justify-content: space-between;
        & div:first-child {
            line-height: 2rem;
        }
    `,
    deleteButton: css`
        margin-top: auto;
        background-color: var(--theme-primary-dark);
    `,
};

interface CheckboxProps {
    label: string;
    checked: boolean;
    onChange: () => void;
}

function Checkbox(props: CheckboxProps): JSX.Element {
    return (
        <label class="label cursor-pointer">
            <span class="label-text">{props.label}</span>
            <input type="checkbox" checked={props.checked} class="checkbox checkbox-primary no-animation" onChange={props.onChange} />
        </label>
    );
}

export interface SettingsPanelProps {
    roomSettings: RoomInfo | null;
    setRoomSettings: (settings: RoomInfo) => void;
    removeAdmin: (id: string) => void;
    submitSettings: () => void;
    removeRoom: () => void;
}

export function SettingsPanel(props: SettingsPanelProps): JSX.Element {
    const [roomAdmins, setRoomAdmins] = createSignal<SiteUser[]>([]);
    const [confirmDeletion, setConfirmDeletion] = createSignal(false);

    const controller = useAbortController();

    createEffect(() => {
        //  Might need better checking if roomAdmins will be updated without the length changing
        if (props.roomSettings && props.roomSettings.admins.length !== roomAdmins().length) {
            Promise.all(props.roomSettings.admins.map(async (a) => await GetAnyUser(controller, a))).then((results) => {
                if (!results.some((r) => r === null))
                    setRoomAdmins(
                        results.reduce((arr: SiteUser[], current: SiteUser | null) => {
                            if (current) arr.push(current);
                            return arr;
                        }, [])
                    );
            });
        }
    });

    const updateName: JSX.EventHandler<HTMLInputElement, Event> = (event): void => {
        if (props.roomSettings === null) return;
        const newSettings = { ...props.roomSettings };
        if (event.currentTarget.value.length > 0) {
            newSettings.settings.name = event.currentTarget.value;
            props.setRoomSettings(newSettings);
        }
    };
    const updateTrim: JSX.EventHandler<HTMLInputElement, Event> = (event): void => {
        if (props.roomSettings === null) return;
        const newSettings = { ...props.roomSettings };
        const val = Number(event.currentTarget.value);
        if (!Number.isNaN(val)) {
            newSettings.settings.trim = Math.floor(val);
            props.setRoomSettings(newSettings);
        }
    };
    const updateGuest = (): void => {
        if (props.roomSettings === null) return;
        const newSettings = { ...props.roomSettings };
        newSettings.settings.guestControls = !newSettings.settings.guestControls;
        props.setRoomSettings(newSettings);
    };
    const updatePublic = (): void => {
        if (props.roomSettings === null) return;
        const newSettings = { ...props.roomSettings };
        newSettings.settings.publicVisibility = !newSettings.settings.publicVisibility;
        props.setRoomSettings(newSettings);
    };
    const updateHifi = (): void => {
        if (props.roomSettings === null) return;
        const newSettings = { ...props.roomSettings };
        newSettings.settings.hifiTiming = !newSettings.settings.hifiTiming;
        props.setRoomSettings(newSettings);
    };
    const updateError = (): void => {
        if (props.roomSettings === null) return;
        const newSettings = { ...props.roomSettings };
        newSettings.settings.skipErrors = !newSettings.settings.skipErrors;
        props.setRoomSettings(newSettings);
    };
    // const updateWait = (): void => {
    //     if (roomSettings === null) return;
    //     const newSettings = { ...roomSettings };
    //     newSettings.settings.waitUsers = !newSettings.settings.waitUsers;
    //     setRoomSettings(newSettings);
    // };

    const maybeDeleteRoom = (): void => {
        if (confirmDeletion()) {
            props.removeRoom();
        } else {
            setConfirmDeletion(true);
        }
    };

    return (
        <div class={style.settingContainer} onClick={(e): void => e.stopPropagation()}>
            <Show when={props.roomSettings}>
                {(settings) => (
                    <div>
                        <div class={["font-semibold", style.settingTrimLabel].join(" ")}>Room name:</div>
                        <div class={style.settingFullWidth}>
                            <input
                                class="input"
                                value={settings.settings.name}
                                onChange={updateName}
                            />
                        </div>
                        <div class={["font-semibold mt-3", style.settingTrimLabel].join(" ")}>Trim:</div>
                        <div class={style.settingTrimField + " form-control w-full"}>
                            <input class="input w-full" value={settings.settings.trim} type="number" onChange={updateTrim} />
                        </div>
                        <Checkbox
                            label="Guest Controls"
                            checked={settings.settings.guestControls}
                            onChange={updateGuest}
                        />
                        <Checkbox
                            label="Public Visibility"
                            checked={settings.settings.publicVisibility}
                            onChange={updatePublic}
                        />
                        <Checkbox
                            label="Higher Fidelity Timing"
                            checked={settings.settings.hifiTiming}
                            onChange={updateHifi}
                        />
                        <Checkbox
                            label="Skip Errored Videos"
                            checked={settings.settings.skipErrors}
                            onChange={updateError}
                        />
                        {/* <Checkbox
                            label="Wait for Video Load"
                            checked={roomSettings.settings.waitUsers}
                            onChange={updateWait}
                        /> */}
                        <div class="font-semibold mt-3">Room Admins:</div>
                        <For each={roomAdmins()}>
                            {(admin) => (
                                <div class={style.settingUserRow}>
                                    <div>{admin.name}</div>
                                    <button
                                        class="btn btn-circle btn-ghost btn-sm inline-flex tooltip"
                                        data-tip="Remove Admin"
                                        onClick={(): void => props.removeAdmin(admin.id)}
                                    >
                                        <TbTrash class={style.settingRemoveIcon} />
                                    </button>
                                </div>
                            )}
                        </For>
                        <button class="btn btn-primary mt-4" onClick={props.submitSettings}>Save</button>
                    </div>
                )}
            </Show>
            <button class="btn btn-secondary mt-auto" onClick={maybeDeleteRoom}>
                <Show when={confirmDeletion()} fallback="Delete Room">Confirm Room Deletion?</Show>
            </button>
        </div>
    );
}
