import { h, JSX } from "preact";
import * as style from "./style.css";
import { useState, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { GetActiveRooms, GetCurrentUser, GetRoomInfo } from "../../utils/RestCalls";
import { RoomInfo, SiteUser } from "../../utils/BackendTypes";
import { useAbortController } from "../../components/AbortController";
import { useGAPIContext } from "../../utils/GAPI";
import { RoomCard } from "../../components/RoomCard";

export function Home(): JSX.Element {
    const [currentUser, setCurrentUser] = useState<SiteUser | null>(null);
    const [roomInfo, setRoomInfo] = useState<RoomInfo[]>([]);
    const [publicRooms, setPublicRooms] = useState<RoomInfo[]>([]);

    const controller = useAbortController();
    const gapi = useGAPIContext();

    useEffect(() => {
        if (gapi?.getUser() !== null)
            GetCurrentUser(controller).then(usr => {
                if (!controller.current.signal.aborted) setCurrentUser(usr);
            });
        GetActiveRooms(controller).then(res => {
            Promise.all(res.map(async a => await GetRoomInfo(a.toString(), controller))).then(results => {
                if (!controller.current.signal.aborted)
                    setPublicRooms(
                        results.reduce((arr: RoomInfo[], current: RoomInfo | null) => {
                            if (current) arr.push(current);
                            return arr;
                        }, [])
                    );
            });
        });
    }, [controller, gapi]);

    useEffect(() => {
        if (currentUser !== null) {
            Promise.all(currentUser.recentRooms.map(async a => await GetRoomInfo(a.toString(), controller))).then(
                results => {
                    if (!controller.current.signal.aborted)
                        setRoomInfo(
                            results.reduce((arr: RoomInfo[], current: RoomInfo | null) => {
                                if (current) arr.push(current);
                                return arr;
                            }, [])
                        );
                }
            );
        }
    }, [controller, currentUser]);

    const adminRooms = currentUser !== null ? roomInfo.filter(r => r.admins.includes(currentUser.id)).reverse() : [];
    const userRooms =
        currentUser !== null
            ? currentUser.recentRooms
                  .map(id => roomInfo.find(r => r.roomID == id && !r.admins.includes(currentUser.id)))
                  .reduce((arr: RoomInfo[], current: RoomInfo | undefined) => {
                      if (current) arr.push(current);
                      return arr;
                  }, [])
                  .reverse()
            : [];
    const filteredPublicRooms = publicRooms.filter(
        r =>
            r.settings.publicVisibility &&
            !adminRooms.some(a => a.roomID === r.roomID) &&
            !userRooms.some(u => u.roomID === r.roomID)
    );

    return (
        <div class={style.home}>
            <h1>Home</h1>
            {currentUser !== null ? (
                <div>
                    {adminRooms.length > 0 ? (
                        <div>
                            <h2>Your Rooms</h2>
                            {adminRooms.map(room => (
                                <RoomCard
                                    key={room.roomID}
                                    roomID={room.roomID}
                                    name={room.settings.name}
                                    onClick={(): void => {
                                        route(`/room/${room.roomID}`);
                                    }}
                                />
                            ))}
                        </div>
                    ) : null}
                    {userRooms.length > 0 ? (
                        <div>
                            <h2>Recent Rooms</h2>
                            {userRooms.map(room => (
                                <RoomCard
                                    key={room.roomID}
                                    roomID={room.roomID}
                                    name={room.settings.name}
                                    onClick={(): void => {
                                        route(`/room/${room.roomID}`);
                                    }}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : null}
            {filteredPublicRooms.length > 0 ? (
                <div>
                    <h2>Public Rooms</h2>
                    {publicRooms.map(room => (
                        <RoomCard
                            key={room.roomID}
                            roomID={room.roomID}
                            name={room.settings.name}
                            onClick={(): void => {
                                route(`/room/${room.roomID}`);
                            }}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}
