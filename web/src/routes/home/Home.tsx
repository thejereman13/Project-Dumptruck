import { h, JSX } from "preact";
import Button from "preact-mui/lib/button";
import * as style from "./style.css";
import { useState, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { GetCurrentUser, GetRoomInfo } from "../../utils/RestCalls";
import { RoomInfo, SiteUser } from "../../utils/BackendTypes";
import { useAbortController } from "../../components/AbortController";
import { useGAPIContext } from "../../utils/GAPI";
import { BlockLoader, DotLoader } from "../../components/LoadingAnimations";

export function Home(): JSX.Element {
    const [currentUser, setCurrentUser] = useState<SiteUser | null>(null);
    const [roomInfo, setRoomInfo] = useState<RoomInfo[]>([]);

    const controller = useAbortController();
    const gapi = useGAPIContext();

    useEffect(() => {
        if (gapi?.getUser() !== null)
            GetCurrentUser(controller).then(usr => {
                setCurrentUser(usr);
            });
    }, [controller, gapi]);

    useEffect(() => {
        if (currentUser !== null) {
            Promise.all(currentUser.recentRooms.map(async a => await GetRoomInfo(a.toString(), controller))).then(
                results => {
                    if (!controller.current.signal.aborted && !results.some(r => r === null))
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

    return (
        <div class={style.home}>
            <h1>Home</h1>
            <DotLoader />
            {currentUser !== null && (
                <div>
                    {adminRooms.length > 0 && (
                        <div>
                            <h3>Your Rooms</h3>
                            {adminRooms.map(room => (
                                <div class={style.roomRow} key={room.roomID}>
                                    <Button
                                        onClick={(): void => {
                                            route(`/room/${room.roomID}`);
                                        }}
                                    >
                                        {room.settings.name}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                    {userRooms.length > 0 && (
                        <div>
                            <h3>Recent Rooms</h3>
                            {userRooms.map(room => (
                                <div class={style.roomRow} key={room.roomID}>
                                    <Button
                                        onClick={(): void => {
                                            route(`/room/${room.roomID}`);
                                        }}
                                    >
                                        {room.settings.name}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
