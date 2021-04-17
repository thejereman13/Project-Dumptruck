import { h } from "preact";
import { useCallback, useRef, useState } from "preact/hooks";

import { VideoQueue } from "./panels/VideoPanel";

import { MdQueueMusic, MdSettings, MdQueue } from "react-icons/md";
import { HiUsers, HiChevronDoubleRight } from "react-icons/hi";

import * as style from "./SidePanel.css";
import { PlaylistByUser } from "../../utils/WebsocketTypes";
import { RoomInfo, RoomUser } from "../../utils/BackendTypes";
import { RoomWebsocketCallbacks } from "./RoomWebsockets";
import { Tooltip } from "../../components/Popup";
import { UserList } from "./panels/UserPanel";
import { SettingsPanel } from "./panels/SettingsPanel";
import { QueueModal } from "./panels/QueuePanel";
import { getSidebarCookie, setSidebarCookie } from "../../utils/Cookies";

interface MountedTabBodyProps {
    current: number;
    index: number;
    children: JSX.Element;
}

function MountedTabBody(props: MountedTabBodyProps): JSX.Element {
    const { current, index, children } = props;
    return (
        <div class={style.sidebarTabBody} style={{ display: current === index ? "flex" : "none" }}>
            {children}
        </div>
    );
}

interface TabIconProps extends MountedTabBodyProps {
    title: string;
    selectTab: (id: number) => void;
    expanded: boolean;
}

const tooltipPlacement: { placement: "bottom" } = { placement: "bottom" };
function TabIcon(props: TabIconProps): JSX.Element {
    const { current, index, title, children, selectTab, expanded } = props;
    return (
        <Tooltip
            content={title}
            options={tooltipPlacement}
            className={[style.sidebarTabIcon, expanded && current === index ? style.sidebarTabSelected : ""].join(" ")}
        >
            <div class={style.sidebarTabIconDiv} onClick={(): void => selectTab(index)}>
                {children}
            </div>
        </Tooltip>
    );
}

export interface SidePanelProps {
    adminPermissions: boolean;
    userID: string;
    playing: boolean;
    adminUsers: string[];
    videoPlaylist: PlaylistByUser;
    userQueue: string[];
    currentUsers: RoomUser[];
    roomSettings: RoomInfo | null;
    setRoomSettings: (settings: RoomInfo) => void;
    wsCallbacks: RoomWebsocketCallbacks;
    playerVolume: number;
    setPlayerVolume: (value: number) => void;
    allowQueuing: boolean;
}

export function SidePanel(props: SidePanelProps): JSX.Element {
    const {
        adminPermissions,
        videoPlaylist,
        userID,
        userQueue,
        currentUsers,
        wsCallbacks,
        adminUsers,
        roomSettings,
        setRoomSettings,
        playerVolume,
        setPlayerVolume,
        playing,
        allowQueuing
    } = props;
    const [expanded, setExpanded] = useState(getSidebarCookie() ? true : false);
    const [displayedTab, setDisplayedTab] = useState(getSidebarCookie());

    const setTab = (index: number): void => {
        setDisplayedTab(index);
        setSidebarCookie(index);
        setExpanded(true);
    };
    const closeTab = (): void => {
        setDisplayedTab(0);
        setExpanded(false);
    };

    const iconSize = "2.5rem";

    const updateRoomSettings = (): void => {
        if (roomSettings !== null) {
            roomSettings.settings.name = roomSettings.settings.name.trim();
            if (roomSettings.settings.name.length > 0) {
                wsCallbacks.updateSettings(roomSettings.settings);
            }
            window.location.href = "#";
        }
    };

    const oldVolume = useRef<number | null>(null);
    const playingPreview = useCallback(
        (p: boolean) => {
            if (p && oldVolume.current === null && playing) {
                oldVolume.current = playerVolume;
                const optionA = oldVolume.current / 4;
                const optionB = 5;
                setPlayerVolume(optionA < optionB ? optionA : optionB);
            } else if (!p && oldVolume.current !== null) {
                setPlayerVolume(oldVolume.current);
                oldVolume.current = null;
            }
        },
        [playerVolume, setPlayerVolume, playing]
    );

    return (
        <div class={[style.sidebarContainer, expanded ? style.sidebarContainerExpanded : ""].join(" ")}>
            <div class={[style.sidebarTabs, expanded ? style.sidebarTabsExpanded : ""].join(" ")}>
                <TabIcon index={1} title="Video Queue" current={displayedTab} selectTab={setTab} expanded={expanded}>
                    <MdQueueMusic size={iconSize} />
                </TabIcon>
                <TabIcon index={2} title="Users" current={displayedTab} selectTab={setTab} expanded={expanded}>
                    <HiUsers size={iconSize} />
                </TabIcon>
                {allowQueuing ? (
                    <TabIcon
                        index={3}
                        title="Add Videos to Queue"
                        current={displayedTab}
                        selectTab={setTab}
                        expanded={expanded}
                    >
                        <MdQueue size={iconSize} />
                    </TabIcon>
                ) : null}
                {adminPermissions ? (
                    <TabIcon
                        index={4}
                        title="Room Settings"
                        current={displayedTab}
                        selectTab={setTab}
                        expanded={expanded}
                    >
                        <MdSettings size={iconSize} />
                    </TabIcon>
                ) : null}
                {expanded ? (
                    <Tooltip content="Minimize" options={tooltipPlacement} className={style.sidebarTabClose}>
                        <div class={style.sidebarTabIcon} onClick={closeTab}>
                            <HiChevronDoubleRight size={iconSize} />
                        </div>
                    </Tooltip>
                ) : null}
            </div>
            <div class={style.sidebarBody}>
                <MountedTabBody index={1} current={displayedTab}>
                    <VideoQueue
                        allowRemoval={adminPermissions}
                        currentUser={userID}
                        currentUsers={currentUsers}
                        openEdit={(id): void => console.log(id)}
                        removeVideo={wsCallbacks.removeVideo}
                        userQueue={userQueue}
                        videoPlaylist={videoPlaylist}
                    />
                </MountedTabBody>
                <MountedTabBody index={2} current={displayedTab}>
                    <UserList
                        addAdmin={wsCallbacks.addAdmin}
                        adminList={adminUsers}
                        currentUsers={currentUsers}
                        isAdmin={adminPermissions}
                        removeAdmin={wsCallbacks.removeAdmin}
                        userID={userID}
                    />
                </MountedTabBody>
                <MountedTabBody index={3} current={allowQueuing ? displayedTab : 0}>
                    <QueueModal
                        playingPreview={playingPreview}
                        submitAllVideos={wsCallbacks.submitAllVideos}
                        submitNewVideo={wsCallbacks.submitNewVideo}
                    />
                </MountedTabBody>
                <MountedTabBody index={4} current={displayedTab}>
                    <SettingsPanel
                        removeAdmin={wsCallbacks.removeAdmin}
                        roomSettings={roomSettings}
                        setRoomSettings={setRoomSettings}
                        submitSettings={updateRoomSettings}
                    />
                </MountedTabBody>
            </div>
        </div>
    );
}
