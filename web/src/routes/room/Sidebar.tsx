import { h, JSX } from "preact";
import * as style from "./style.css";
import { Modal } from "../../components/Modal";
import { Tab, Tabs } from "../../components/Tabs";
import { EditModal } from "./EditModal";
import { UserList } from "./UserList";
import { VideoQueue } from "./VideoQueue";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { RoomUser, YoutubeVideoInformation } from "../../utils/BackendTypes";
import { PlaylistByUser } from "../../utils/WebsocketTypes";

export interface RoomSidebarProps {
    currentUsers: RoomUser[];
    videoPlaylist: PlaylistByUser;
    userQueue: string[];
    userID: string;
    removeVideo: (id: string) => void;
    isAdmin: boolean;
    adminUsers: string[];
    addAdmin: (id: string) => void;
    removeAdmin: (id: string) => void;
    removeAllVideos: (id: string) => void;
    reorderQueue: (id: string, videos: YoutubeVideoInformation[]) => void;
}

export function RoomSidebar(props: RoomSidebarProps): JSX.Element {
    const {
        currentUsers,
        videoPlaylist,
        userQueue,
        userID,
        removeVideo,
        isAdmin,
        adminUsers,
        addAdmin,
        removeAdmin,
        removeAllVideos,
        reorderQueue
    } = props;
    const [sidebarTab, setSidebarTab] = useState(0);
    const editClosed = useRef<() => void | null>(null);
    const [editedQueue, setEditedQueue] = useState<string>("");

    const openEditModal = useCallback((id: string): void => {
        window.location.href = "#EditQueue";
        setEditedQueue(id);
    }, []);

    useEffect(() => {
        if (window.location.href === "#EditQueue") {
            if (editedQueue.length === 0 || currentUsers.findIndex(u => u.clientID === editedQueue) < 0)
                window.location.href = "#";
        }
    }, [editedQueue, currentUsers]);

    return (
        <div class={style.sidePanel}>
            <Tabs tabNames={["Video Queue", "Room Users"]} onIndex={setSidebarTab} index={sidebarTab} justified />
            <div class={style.sidePanelTabBody}>
                <Tab index={0} tabIndex={sidebarTab}>
                    <VideoQueue
                        videoPlaylist={videoPlaylist}
                        userQueue={userQueue}
                        currentUser={userID}
                        currentUsers={currentUsers}
                        removeVideo={removeVideo}
                        openEdit={openEditModal}
                        allowRemoval={isAdmin}
                    />
                </Tab>
                <Tab index={1} tabIndex={sidebarTab}>
                    <UserList
                        currentUsers={currentUsers}
                        adminList={adminUsers}
                        isAdmin={isAdmin}
                        userID={userID}
                        addAdmin={addAdmin}
                        removeAdmin={removeAdmin}
                    />
                </Tab>
            </div>
            <Modal className={style.QueueContainer} idName="EditQueue" onClose={editClosed.current}>
                <EditModal
                    userID={editedQueue}
                    playlist={videoPlaylist[editedQueue] ?? []}
                    userName={currentUsers.find(u => u.clientID === editedQueue)?.name ?? ""}
                    self={editedQueue === userID}
                    removeVideo={removeVideo}
                    removeAll={removeAllVideos}
                    closeCallback={editClosed}
                    updatePlaylist={(user, newPlaylist): void =>
                        reorderQueue(
                            user,
                            newPlaylist.map(v => ({ videoID: v.youtubeID, duration: v.duration }))
                        )
                    }
                />
            </Modal>
        </div>
    );
}
