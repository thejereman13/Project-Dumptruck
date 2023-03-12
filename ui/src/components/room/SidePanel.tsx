import { createEffect, createSignal, JSX, Show } from "solid-js";
import { css } from "solid-styled-components";
import { RoomInfo, RoomUser } from "../../utils/BackendTypes";
import { getSidebarCookie, setSidebarCookie } from "../../utils/Cookies";
import { useCallbackHook } from "../../utils/EventSubscriber";
import { RemoveRoom } from "../../utils/RestCalls";
import { PlaylistByUser } from "../../utils/WebsocketTypes";
import { RoomWebsocketCallbacks } from "./RoomWebsockets";

import {
    TbPlaylist,
    TbListNumbers,
    TbPlaylistAdd,
    TbHistory,
    TbUsers,
    TbSettings,
    TbChevronsRight,
} from "solid-icons/tb";
import { VideoQueue } from "./VideoPanel";
import { QueueModal } from "./QueuePanel";
import { EditModal } from "./EditModal";
import { HistoryPanel } from "./HistoryPanel";
import { UserList } from "./UserPanel";
import { SettingsPanel } from "./SettingsPanel";

const style = {
    sidebarContainer: css`
        width: 4.5rem;
        background-color: var(--dp4-surface);
        padding-top: 0.5rem;
        transition: width 0.2s;
        overflow: hidden;
        display: flex;
        flex-flow: column;
        @media (max-width: 960px) {
            width: 100%;
        }
    `,
    sidebarContainerExpanded: css`
        width: 40rem;
        max-width: 40rem;
        min-width: 40rem;
        @media (max-width: 960px) {
            max-width: unset;
            width: 100%;
        }
    `,
    sidebarTabs: css`
        display: flex;
        flex-flow: wrap;
    `,
    sidebarTabsExpanded: css`
        padding: 0 0.5rem;
        border-bottom: 2px solid var(--theme-secondary-dark);
        padding-bottom: 0.25rem;
        margin: var(--expandedMargin, unset);
        --expandedMargin: 0 0.5rem;
        --expandedHeight: 100%;
    `,
    sidebarTabIcon: css`
        color: var(--theme-secondary);
        padding: 0.75rem;
        margin: var(--expandedMargin, 0.25rem 0.125rem);
        height: var(--expandedHeight, unset);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        &:hover {
            background: rgba(0, 0, 0, 0.2);
            color: var(--theme-secondary-light);
        }
    `,
    sidebarTabIconDiv: css`
        display: flex;
    `,
    sidebarTabSelected: css`
        color: var(--theme-primary-dark);
        &:hover {
            color: var(--theme-primary-dark);
        }
    `,
    sidebarTabClose: css`
        margin-left: auto;
        @media (max-width: 960px) {
            transform: rotate(90deg);
        }
    `,
    sidebarBody: css`
        display: flex;
        overflow: hidden;
        height: 100%;
        width: 100%;
    `,
    sidebarTabBody: css`
        width: 100%;
        overflow-x: hidden;
        overflow-y: auto;
    `,
};

interface MountedTabBodyProps {
    current: number;
    index: number;
    children: JSX.Element;
}

function MountedTabBody(props: MountedTabBodyProps): JSX.Element {
    return (
        <div class={style.sidebarTabBody} style={{ display: props.current === props.index ? "flex" : "none" }}>
            {props.children}
        </div>
    );
}

interface TabIconProps extends MountedTabBodyProps {
    title: string;
    selectTab: (id: number) => void;
    expanded: boolean;
}

function TabIcon(props: TabIconProps): JSX.Element {
    return (
        <div
            data-tip={props.title}
            classList={{
                [style.sidebarTabIcon]: true,
                "tooltip tooltip-bottom z-10": true,
                [style.sidebarTabSelected]: props.expanded && props.current === props.index,
            }}
            onClick={(): void => props.selectTab(props.index)}
        >
            <div class={style.sidebarTabIconDiv}>{props.children}</div>
        </div>
    );
}

export interface SidePanelProps {
    adminPermissions: boolean;
    userID: string;
    playing: boolean;
    adminUsers: string[];
    history: string[];
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
    const [expanded, setExpanded] = createSignal(getSidebarCookie() ? true : false);
    const [displayedTab, setDisplayedTab] = createSignal(getSidebarCookie());
    const [editedUserQueue, setEditedQueue] = createSignal<string>("");

    createEffect(() => {
        setEditedQueue(props.userID);
    });

    const setTab = (index: number): void => {
        setDisplayedTab(index);
        setSidebarCookie(index);
        setExpanded(true);
        // reset any temporal tab values
        setEditedQueue(props.userID);
    };
    const closeTab = (): void => {
        setDisplayedTab(0);
        setExpanded(false);
    };

    const iconSize = "2.5rem";

    const updateRoomSettings = (): void => {
        if (props.roomSettings !== null) {
            const newSettings = { ...props.roomSettings.settings };
            newSettings.name = newSettings.name.trim();
            if (newSettings.name.length > 0) {
                props.wsCallbacks.updateSettings(newSettings);
            }
        }
    };

    const removeRoom = (): void => {
        RemoveRoom(props.roomSettings?.roomID ?? 0).then((res) => {
            if (res) document.location.href = "/";
        });
    };

    const editOtherUser = (id: string): void => {
        setEditedQueue(id);
        setDisplayedTab(3);
    };

    let oldVolume: number | null = null;
    const playingPreview = (p: boolean) => {
        if (p && oldVolume === null && props.playing) {
            oldVolume = props.playerVolume;
            const optionA = oldVolume / 4;
            const optionB = 5;
            props.setPlayerVolume(optionA < optionB ? optionA : optionB);
        } else if (!p && oldVolume !== null) {
            props.setPlayerVolume(oldVolume);
            oldVolume = null;
        }
    };
    useCallbackHook("preview", playingPreview);

    const userHasQueue = () => props.videoPlaylist[editedUserQueue()]?.length > 0;

    createEffect(() => {
        if (!userHasQueue() && displayedTab() === 3) {
            if (props.allowQueuing) setDisplayedTab(2);
            else setDisplayedTab(1);
        }
    });

    return (
        <div class={[style.sidebarContainer, expanded() ? style.sidebarContainerExpanded : ""].join(" ")}>
            <div class={[style.sidebarTabs, expanded() ? style.sidebarTabsExpanded : ""].join(" ")}>
                <TabIcon
                    index={1}
                    title="Video Queue"
                    current={displayedTab()}
                    selectTab={setTab}
                    expanded={expanded()}
                >
                    <TbPlaylist size={iconSize} />
                </TabIcon>
                <Show when={props.allowQueuing}>
                    <TabIcon
                        index={2}
                        title="Add Videos to Queue"
                        current={displayedTab()}
                        selectTab={setTab}
                        expanded={expanded()}
                    >
                        <TbPlaylistAdd size={iconSize} />
                    </TabIcon>
                </Show>
                <Show when={userHasQueue()}>
                    <TabIcon
                        index={3}
                        title="Edit Queue"
                        current={displayedTab()}
                        selectTab={setTab}
                        expanded={expanded()}
                    >
                        <TbListNumbers size={iconSize} />
                    </TabIcon>
                </Show>
                <Show when={props.history.length > 0}>
                    <TabIcon
                        index={4}
                        title="History"
                        current={displayedTab()}
                        selectTab={setTab}
                        expanded={expanded()}
                    >
                        <TbHistory size={iconSize} />
                    </TabIcon>
                </Show>
                <TabIcon index={5} title="Users" current={displayedTab()} selectTab={setTab} expanded={expanded()}>
                    <TbUsers size={iconSize} />
                </TabIcon>
                <Show when={props.adminPermissions}>
                    <TabIcon
                        index={6}
                        title="Room Settings"
                        current={displayedTab()}
                        selectTab={setTab}
                        expanded={expanded()}
                    >
                        <TbSettings size={iconSize} />
                    </TabIcon>
                </Show>
                <Show when={expanded()}>
                    <div
                        dat-tip="Minimize"
                        classList={{ "tooltip tooltip-bottom": true, [style.sidebarTabClose]: true }}
                        onClick={closeTab}
                    >
                        <div class={style.sidebarTabIcon}>
                            <TbChevronsRight size={iconSize} />
                        </div>
                    </div>
                </Show>
            </div>
            <div class={style.sidebarBody}>
                <MountedTabBody index={1} current={displayedTab()}>
                    <VideoQueue
                        allowRemoval={props.adminPermissions}
                        currentUser={props.userID}
                        currentUsers={props.currentUsers}
                        openEdit={editOtherUser}
                        userQueue={props.userQueue}
                        videoPlaylist={props.videoPlaylist}
                    />
                </MountedTabBody>
                <MountedTabBody index={2} current={props.allowQueuing ? displayedTab() : 0}>
                    <QueueModal
                        submitAllVideos={props.wsCallbacks.submitAllVideos}
                        submitNewVideoEnd={props.wsCallbacks.submitVideoBack}
                        submitNewVideoFront={props.wsCallbacks.submitVideoFront}
                    />
                </MountedTabBody>
                <MountedTabBody index={3} current={props.allowQueuing ? displayedTab() : 0}>
                    <EditModal
                        userID={editedUserQueue()}
                        playlist={props.videoPlaylist[editedUserQueue()] ?? []}
                        userName={props.currentUsers.find((u) => u.clientID === editedUserQueue())?.name ?? ""}
                        self={editedUserQueue() === props.userID}
                        removeVideo={props.wsCallbacks.removeVideo}
                        removeAll={props.wsCallbacks.removeAllVideos}
                        updatePlaylist={(user, newPlaylist): void =>
                            props.wsCallbacks.reorderQueue(
                                user,
                                newPlaylist.map((v) => ({ videoID: v.youtubeID, duration: v.duration }))
                            )
                        }
                    />
                </MountedTabBody>
                <MountedTabBody index={4} current={displayedTab()}>
                    <HistoryPanel
                        history={props.history}
                        submitNewVideoFront={props.wsCallbacks.submitVideoFront}
                        submitNewVideoEnd={props.wsCallbacks.submitVideoBack}
                    />
                </MountedTabBody>
                <MountedTabBody index={5} current={displayedTab()}>
                    <UserList
                        addAdmin={props.wsCallbacks.addAdmin}
                        adminList={props.adminUsers}
                        currentUsers={props.currentUsers}
                        isAdmin={props.adminPermissions}
                        removeAdmin={props.wsCallbacks.removeAdmin}
                        userID={props.userID}
                    />
                </MountedTabBody>
                <MountedTabBody index={6} current={props.adminPermissions ? displayedTab() : 0}>
                    <SettingsPanel
                        removeAdmin={props.wsCallbacks.removeAdmin}
                        roomSettings={props.roomSettings}
                        setRoomSettings={props.setRoomSettings}
                        submitSettings={updateRoomSettings}
                        removeRoom={removeRoom}
                    />
                </MountedTabBody>
            </div>
        </div>
    );
}
