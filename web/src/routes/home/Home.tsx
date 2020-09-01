import { h, JSX } from "preact";
import Button from "preact-mui/lib/button";
import * as style from "./style.css";
import { useState, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { GetCurrentUser } from "../../utils/RestCalls";
import { SiteUser } from "../../utils/BackendTypes";
import { useAbortController } from "../../components/AbortController";
import { useGAPIContext } from "../../utils/GAPI";

export function Home(): JSX.Element {
    const [currentUser, setCurrentUser] = useState<SiteUser | null>(null);

    const controller = useAbortController();
    const gapi = useGAPIContext();

    useEffect(() => {
        if (gapi?.getUser() !== null)
            GetCurrentUser(controller).then(usr => {
                setCurrentUser(usr);
            });
    }, [controller, gapi]);

    return (
        <div class={style.home}>
            <h1>Home</h1>
            {currentUser !== null && (
                <div>
                    <h3>Recent Rooms</h3>
                    {currentUser.recentRooms.map(room => (
                        <div class={style.roomRow} key={room}>
                            <Button
                                onClick={(): void => {
                                    route(`/room/${room}`);
                                }}
                            >{`Room ${room}`}</Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
