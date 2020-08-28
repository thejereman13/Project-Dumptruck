import { h, JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import Checkbox from "preact-mui/lib/checkbox";
import Button from "preact-mui/lib/button";
import Input from "preact-mui/lib/input";
import { RoomSettings, RoomInfo, SiteUser } from "../../utils/BackendTypes";
import * as style from "./style.css";
import { GetRoomInfo, GetAnyUser } from "../../utils/RestCalls";
import { useAbortController } from "../../components/AbortController";

export interface SettingModalProps {
    roomID: string;
    updateSettings: (settings: RoomSettings) => void;
    onClose: () => void;
}

export function SettingModal(props: SettingModalProps): JSX.Element {
    const { roomID, updateSettings, onClose } = props;
    const [roomSettings, setRoomSettings] = useState<RoomInfo | null>(null);
    const [roomAdmins, setRoomAdmins] = useState<SiteUser[]>([]);

    const controller = useAbortController();

    useEffect(() => {
        GetRoomInfo(roomID, controller).then(settings => {
            if (!controller.current.signal.aborted) setRoomSettings(settings);
        });
    }, [roomID, controller]);

    useEffect(() => {
        //  Might need better checking if roomAdmins will be updated without the length changing
        if (roomSettings && roomSettings.admins.length !== roomAdmins.length) {
            Promise.all(roomSettings.admins.map(async a => await GetAnyUser(a, controller))).then(results => {
                if (!results.some(r => r === null))
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
            console.log(val);
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

    const submitSettings = (): void => {
        if (roomSettings !== null) {
            updateSettings(roomSettings.settings);
            onClose();
        }
    };

    return (
        <div class={style.ModalBox} onClick={(e): void => e.stopPropagation()}>
            {roomSettings && (
                <div>
                    <div>
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
                    <br />
                    <div class="mui--text-title">Room Admins:</div>
                    {roomAdmins.map(admin => (
                        <div class="mui--text-subhead" key={admin.id}>
                            {admin.name}
                        </div>
                    ))}
                    <Button onClick={submitSettings}>Save</Button>
                </div>
            )}
        </div>
    );
}
