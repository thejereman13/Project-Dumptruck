import { h, JSX } from "preact";
import Button from "preact-mui/lib/button";
import * as style from "./style.css";
import { useState, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { GetCurrentUser } from "../../utils/RestCalls";
import { SiteUser } from "../../utils/BackendTypes";

export function Home(): JSX.Element {
    const [currentUser, setCurrentUser] = useState<SiteUser | null>(null);

    useEffect(() => {
        GetCurrentUser().then(usr => {
            setCurrentUser(usr);
        });
    }, []);

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
