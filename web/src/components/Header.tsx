import { JSX, h } from "preact";
import { Link } from "preact-router/match";
import { useGAPIContext } from "../utils/GAPI";
import { Tooltip } from "./Popup";
import { APPVERSION } from "../constants";
import { useEffect, useState } from "preact/hooks";
import { useCallbackHook } from "../utils/EventSubscriber";
import { css } from "@linaria/core";

const style = {
    header: css`
        position: fixed;
        left: 0;
        top: 0;
        height: var(--navbar-height);
        width: 100%;
        padding: 0;
        background: var(--dp2-surface);
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
        z-index: 50;
        & h1 {
            float: left;
            margin: 0;
            padding: 0 1rem;
            font-size: 2rem;
            font-weight: 400;
            line-height: var(--navbar-height);
            color: var(--text-secondary);
        }
    `,
    headerWatch: css`
        float: left;
        height: 100%;
        padding: 0.25rem 0 0.25rem 0.5rem;
    `,
    headerNav: css`
        display: inline-block;
        padding: 0 1rem;
        min-width: 3rem;
        height: var(--navbar-height);
        background: rgba(255, 255, 255, 0);
        text-decoration: none;
        font-weight: 600;
        color: var(--theme-primary-dark) !important;
        will-change: background-color;
        font-size: 1.5rem;
        cursor: pointer;
        line-height: var(--navbar-height);
        vertical-align: top;
        &:hover,
        &:active {
            background: rgba(0, 0, 0, 0.2);
            text-decoration: none;
        }
        &.active {
            background: rgba(0, 0, 0, 0.4);
        }
    `,
    headerRight: css`
        float: right;
        padding-right: 0.5rem;
    `,
    headerUserIcon: css`
        height: var(--navbar-height);
        border-radius: 50%;
        margin-left: 1rem;
        vertical-align: top;
        padding: 0.25rem 0;
    `,
    headerRoom: css`
        padding: 0 3rem;
        color: var(--theme-primary) !important;
        font-size: 1.75rem;
        font-weight: 500;
    `
};


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
                <Link class={style.headerNav} activeClassName="active" href="/">
                    Home
                </Link>
                {roomName ? (
                    <Link class={[style.headerRoom, style.headerNav, "active"].join(" ")}>{roomName}</Link>
                ) : null}
                {user ? (
                    <Link
                        class={[style.headerNav, style.headerRight].join(" ")}
                        activeClassName="active"
                        href="/profile"
                    >
                        Profile
                        <img class={style.headerUserIcon} src={user.profileURL} />
                    </Link>
                ) : (
                    <Link
                        class={[style.headerNav, style.headerRight].join(" ")}
                        activeClassName={"active"}
                        href="/login"
                    >
                        Login
                    </Link>
                )}
            </nav>
        </header>
    );
}
