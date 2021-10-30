import { h } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import { VideoQueue } from "../panels/VideoPanel";

import MdQueueMusic from "@meronex/icons/md/MdQueueMusic";
import MdSettings from "@meronex/icons/md/MdSettings";
import MdQueue from "@meronex/icons/md/MdQueue";
import MdHistory from "@meronex/icons/md/MdHistory";
import MdFormatListNumbered from "@meronex/icons/md/MdFormatListNumbered";

import HiUsers from "@meronex/icons/hi/HiUsers";
import MdcChevronDoubleRight from "@meronex/icons/mdc/MdcChevronDoubleRight";

import { PlaylistByUser } from "../../../utils/WebsocketTypes";
import { RoomInfo, RoomUser } from "../../../utils/BackendTypes";
import { RoomWebsocketCallbacks } from "../RoomWebsockets";
import { Tooltip } from "../../../components/Popup";
import { UserList } from "../panels/UserPanel";
import { SettingsPanel } from "../panels/SettingsPanel";
import { QueueModal } from "../panels/QueuePanel";
import { HistoryPanel } from "../panels/HistoryPanel";
import { EditModal } from "../panels/EditModal";
import { getSidebarCookie, setSidebarCookie } from "../../../utils/Cookies";
import { useCallbackHook } from "../../../utils/EventSubscriber";
import { RemoveRoom } from "../../../utils/RestCalls";
import { route } from "preact-router";
import { css } from "@linaria/core";

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
    `
};

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
            onClick={(): void => selectTab(index)}
        >
            <div class={style.sidebarTabIconDiv}>{children}</div>
        </Tooltip>
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
    const {
        adminPermissions,
        videoPlaylist,
        userID,
        history,
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
    const [editedUserQueue, setEditedQueue] = useState<string>("");

    useEffect(() => {
        setEditedQueue(userID);
    }, [userID]);

    const setTab = (index: number): void => {
        setDisplayedTab(index);
        setSidebarCookie(index);
        setExpanded(true);
        // reset any temporal tab values
        setEditedQueue(userID);
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
        }
    };

    const removeRoom = (): void => {
        RemoveRoom(roomSettings?.roomID ?? 0).then((res) => {
            if (res) route("/");
        });
    };

    const editOtherUser = (id: string): void => {
        setEditedQueue(id);
        setDisplayedTab(3);
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
    useCallbackHook("preview", playingPreview);

    const userHasQueue = videoPlaylist[editedUserQueue]?.length > 0;

    useEffect(() => {
        if (!userHasQueue && displayedTab === 3) {
            if (allowQueuing)
                setDisplayedTab(2);
            else
                setDisplayedTab(1);
        }
    }, [userHasQueue]);

    return (
        <div class={[style.sidebarContainer, expanded ? style.sidebarContainerExpanded : ""].join(" ")}>
            <div class={[style.sidebarTabs, expanded ? style.sidebarTabsExpanded : ""].join(" ")}>
                <TabIcon index={1} title="Video Queue" current={displayedTab} selectTab={setTab} expanded={expanded}>
                    <MdQueueMusic size={iconSize} />
                </TabIcon>
                {allowQueuing ? (
                    <TabIcon
                        index={2}
                        title="Add Videos to Queue"
                        current={displayedTab}
                        selectTab={setTab}
                        expanded={expanded}
                    >
                        <MdQueue size={iconSize} />
                    </TabIcon>
                ) : null}
                {userHasQueue ? (
                    <TabIcon index={3} title="Edit Queue" current={displayedTab} selectTab={setTab} expanded={expanded}>
                        <MdFormatListNumbered size={iconSize} />
                    </TabIcon>
                ) : null}
                {history.length > 0 ? (
                    <TabIcon index={4} title="History" current={displayedTab} selectTab={setTab} expanded={expanded}>
                        <MdHistory size={iconSize} />
                    </TabIcon>
                ) : null}
                <TabIcon index={5} title="Users" current={displayedTab} selectTab={setTab} expanded={expanded}>
                    <HiUsers size={iconSize} />
                </TabIcon>
                {adminPermissions ? (
                    <TabIcon
                        index={6}
                        title="Room Settings"
                        current={displayedTab}
                        selectTab={setTab}
                        expanded={expanded}
                    >
                        <MdSettings size={iconSize} />
                    </TabIcon>
                ) : null}
                {expanded ? (
                    <Tooltip
                        content="Minimize"
                        options={tooltipPlacement}
                        className={style.sidebarTabClose}
                        onClick={closeTab}
                    >
                        <div class={style.sidebarTabIcon}>
                            <MdcChevronDoubleRight size={iconSize} />
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
                        openEdit={editOtherUser}
                        userQueue={userQueue}
                        videoPlaylist={videoPlaylist}
                    />
                </MountedTabBody>
                <MountedTabBody index={2} current={allowQueuing ? displayedTab : 0}>
                    <QueueModal
                        submitAllVideos={wsCallbacks.submitAllVideos}
                        submitNewVideoEnd={wsCallbacks.submitVideoBack}
                        submitNewVideoFront={wsCallbacks.submitVideoFront}
                    />
                </MountedTabBody>
                <MountedTabBody index={3} current={allowQueuing ? displayedTab : 0}>
                    <EditModal
                        userID={editedUserQueue}
                        playlist={videoPlaylist[editedUserQueue] ?? []}
                        userName={currentUsers.find((u) => u.clientID === editedUserQueue)?.name ?? ""}
                        self={editedUserQueue === userID}
                        removeVideo={wsCallbacks.removeVideo}
                        removeAll={wsCallbacks.removeAllVideos}
                        updatePlaylist={(user, newPlaylist): void =>
                            wsCallbacks.reorderQueue(
                                user,
                                newPlaylist.map((v) => ({ videoID: v.youtubeID, duration: v.duration }))
                            )
                        }
                    />
                </MountedTabBody>
                <MountedTabBody index={4} current={displayedTab}>
                    <HistoryPanel
                        history={history}
                        submitNewVideoFront={wsCallbacks.submitVideoFront}
                        submitNewVideoEnd={wsCallbacks.submitVideoBack}
                    />
                </MountedTabBody>
                <MountedTabBody index={5} current={displayedTab}>
                    <UserList
                        addAdmin={wsCallbacks.addAdmin}
                        adminList={adminUsers}
                        currentUsers={currentUsers}
                        isAdmin={adminPermissions}
                        removeAdmin={wsCallbacks.removeAdmin}
                        userID={userID}
                    />
                </MountedTabBody>
                <MountedTabBody index={6} current={adminPermissions ? displayedTab : 0}>
                    <SettingsPanel
                        removeAdmin={wsCallbacks.removeAdmin}
                        roomSettings={roomSettings}
                        setRoomSettings={setRoomSettings}
                        submitSettings={updateRoomSettings}
                        removeRoom={removeRoom}
                    />
                </MountedTabBody>
            </div>
        </div>
    );
}
