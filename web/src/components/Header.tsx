import { JSX, h } from "preact";
import { Link } from "preact-router/match";
import * as style from "./Header.css";
import { useGAPIContext } from "../utils/GAPI";
import { Tooltip } from "./Popup";
import { APPVERSION } from "../constants";
import { useEffect, useState } from "preact/hooks";
import { useCallbackHook } from "../utils/EventSubscriber";

export function Header(): JSX.Element {
    const [roomName, setRoomName] = useState("");
    const currentAPI = useGAPIContext();
    const user = currentAPI?.getUser();

    useCallbackHook("roomName", setRoomName);

    useEffect(() => {
        if (roomName.length > 0) document.title = "Krono: " + roomName;
        else document.title = "Krono";
    }, [roomName]);

    return (
        <header class={["mui--appbar-height", "mui--appbar-line-height", style.header].join(" ")}>
            <img className={style.headerWatch} src="/assets/watch1.png" />
            <Tooltip content={`Version: ${APPVERSION}`} delay={1000}>
                <h1>Krono</h1>
            </Tooltip>
            <nav>
                <Link class={style.headerNav} activeClassName={style.active} href="/">
                    Home
                </Link>
                {roomName ? (
                    <Link class={[style.headerRoom, style.headerNav, style.active].join(" ")}>{roomName}</Link>
                ) : null}
                {user ? (
                    <Link
                        class={[style.headerNav, style.headerRight].join(" ")}
                        activeClassName={style.active}
                        href="/profile"
                    >
                        Profile
                        <img class={style.headerUserIcon} src={user.profileURL} />
                    </Link>
                ) : (
                    <Link
                        class={[style.headerNav, style.headerRight].join(" ")}
                        activeClassName={style.active}
                        href="/login"
                    >
                        Login
                    </Link>
                )}
            </nav>
        </header>
    );
}
