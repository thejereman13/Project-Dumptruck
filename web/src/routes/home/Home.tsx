import { h, JSX } from "preact";
import Button from "preact-mui/lib/button";
import * as style from "./style.css";
import { useState, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { GetCurrentUser } from "../../utils/RestCalls";
import { SiteUser } from "../../utils/BackendTypes";
import { useAbortController } from "../../components/AbortController";

export function Home(): JSX.Element {
    const [currentUser, setCurrentUser] = useState<SiteUser | null>(null);

    const controller = useAbortController();

    useEffect(() => {
        GetCurrentUser(controller).then(usr => {
            setCurrentUser(usr);
        });
    }, [controller]);

    return (
        <div class={style.home}>
            <h1>Home</h1>
            {currentUser !== null && (
                <div>
                    <h3>Recent Rooms</h3>
                    {currentUser.recentRooms.map(room => (
                        <div class={style.roomRow} key={room}>
                            <Button onClick={(): boolean => route(`/room/${room}`)}>{`Room ${room}`}</Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
