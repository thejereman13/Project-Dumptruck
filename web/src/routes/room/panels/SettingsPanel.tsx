import { h, JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import Checkbox from "preact-mui/lib/checkbox";
import Button from "preact-mui/lib/button";
import Input from "preact-mui/lib/input";
import { RoomInfo, SiteUser } from "../../../utils/BackendTypes";
import * as style from "./SettingsPanel.css";
import { GetAnyUser } from "../../../utils/RestCalls";
import { useAbortController } from "../../../utils/AbortController";
import { Tooltip } from "../../../components/Popup";

import MdTrash from "@meronex/icons/ios/MdTrash";

export interface SettingsPanelProps {
    roomSettings: RoomInfo | null;
    setRoomSettings: (settings: RoomInfo) => void;
    removeAdmin: (id: string) => void;
    submitSettings: () => void;
    removeRoom: () => void;
}

export function SettingsPanel(props: SettingsPanelProps): JSX.Element {
    const { removeAdmin, roomSettings, setRoomSettings, submitSettings, removeRoom } = props;
    const [roomAdmins, setRoomAdmins] = useState<SiteUser[]>([]);
    const [confirmDeletion, setConfirmDeletion] = useState(false);

    const controller = useAbortController();

    useEffect(() => {
        //  Might need better checking if roomAdmins will be updated without the length changing
        if (roomSettings && roomSettings.admins.length !== roomAdmins.length) {
            Promise.all(roomSettings.admins.map(async (a) => await GetAnyUser(a, controller))).then((results) => {
                if (!results.some((r) => r === null))
                    setRoomAdmins(
                        results.reduce((arr: SiteUser[], current: SiteUser | null) => {
                            if (current) arr.push(current);
                            return arr;
                        }, [])
                    );
            });
        }
    }, [roomSettings, roomAdmins, controller]);

    const updateName = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (roomSettings === null) return;
        const newSettings = { ...roomSettings };
        if (event.currentTarget.value.length > 0) {
            newSettings.settings.name = event.currentTarget.value;
            setRoomSettings(newSettings);
        }
    };
    const updateTrim = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (roomSettings === null) return;
        const newSettings = { ...roomSettings };
        const val = Number(event.currentTarget.value);
        if (!Number.isNaN(val)) {
            newSettings.settings.trim = Math.floor(val);
            setRoomSettings(newSettings);
        }
    };
    const updateGuest = (): void => {
        if (roomSettings === null) return;
        const newSettings = { ...roomSettings };
        newSettings.settings.guestControls = !newSettings.settings.guestControls;
        setRoomSettings(newSettings);
    };
    const updatePublic = (): void => {
        if (roomSettings === null) return;
        const newSettings = { ...roomSettings };
        newSettings.settings.publicVisibility = !newSettings.settings.publicVisibility;
        setRoomSettings(newSettings);
    };
    const updateHifi = (): void => {
        if (roomSettings === null) return;
        const newSettings = { ...roomSettings };
        newSettings.settings.hifiTiming = !newSettings.settings.hifiTiming;
        setRoomSettings(newSettings);
    };
    const updateError = (): void => {
        if (roomSettings === null) return;
        const newSettings = { ...roomSettings };
        newSettings.settings.skipErrors = !newSettings.settings.skipErrors;
        setRoomSettings(newSettings);
    };
    // const updateWait = (): void => {
    //     if (roomSettings === null) return;
    //     const newSettings = { ...roomSettings };
    //     newSettings.settings.waitUsers = !newSettings.settings.waitUsers;
    //     setRoomSettings(newSettings);
    // };

    const maybeDeleteRoom = (): void => {
        if (confirmDeletion) {
            removeRoom();
        } else {
            setConfirmDeletion(true);
        }
    };

    return (
        <div class={style.settingContainer} onClick={(e): void => e.stopPropagation()}>
            {roomSettings ? (
                <div>
                    <div class={style.settingFullWidth}>
                        <Input
                            floatingLabel
                            label="Room Name"
                            value={roomSettings.settings.name}
                            onChange={updateName}
                        />
                    </div>
                    <div class={["mui--text-subhead", style.settingTrimLabel].join(" ")}>Trim:</div>
                    <div class={style.settingTrimField}>
                        <Input value={roomSettings.settings.trim} type="number" onChange={updateTrim} />
                    </div>
                    <Checkbox
                        label="Guest Controls"
                        defaultChecked={roomSettings.settings.guestControls}
                        onChange={updateGuest}
                    />
                    <Checkbox
                        label="Public Visibility"
                        defaultChecked={roomSettings.settings.publicVisibility}
                        onChange={updatePublic}
                    />
                    <Checkbox
                        label="Higher Fidelity Timing"
                        defaultChecked={roomSettings.settings.hifiTiming}
                        onChange={updateHifi}
                    />
                    <Checkbox
                        label="Skip Errored Videos"
                        defaultChecked={roomSettings.settings.skipErrors}
                        onChange={updateError}
                    />
                    {/* <Checkbox
                        label="Wait for Video Load"
                        defaultChecked={roomSettings.settings.waitUsers}
                        onChange={updateWait}
                    /> */}
                    <br />
                    <div class="mui--text-title">Room Admins:</div>
                    {roomAdmins.map((admin) => (
                        <div key={admin.id} class={style.settingUserRow}>
                            <div class="mui--text-subhead">{admin.name}</div>
                            <Tooltip className={style.centerTooltipChild} content="Remove Admin">
                                <Button
                                    onClick={(): void => removeAdmin(admin.id)}
                                    size="tiny"
                                    variant="fab"
                                    color="accent"
                                >
                                    <MdTrash className={style.settingRemoveIcon} />
                                </Button>
                            </Tooltip>
                        </div>
                    ))}
                    <Button onClick={submitSettings}>Save</Button>
                </div>
            ) : null}
            <Button className={["mui-btn", style.deleteButton].join(" ")} variant="secondary" onClick={maybeDeleteRoom}>
                {confirmDeletion ? "Confirm Room Deletion?" : "Delete Room"}
            </Button>
        </div>
    );
}
