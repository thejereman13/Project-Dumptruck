import { createEffect, createSignal, JSX, Show } from "solid-js";
import { NavLink } from "@solidjs/router";
import { APPVERSION } from "../constants";
import { css } from "solid-styled-components";
import { siteUser } from "../Login";

const style = {
    header: css`
        position: fixed;
        display: flex;
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
        & nav {
            flex: auto;
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
        display: inline-flex;
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
    `,
};

export const [roomName, setRoomName] = createSignal("");

export function Header(): JSX.Element {
    createEffect(() => {
        if (roomName().length > 0) document.title = "Krono: " + roomName();
        else document.title = "Krono";
        if (siteUser()) {
            console.log(siteUser()?.expiry_date);
        }
    });

    return (
        <header class={style.header}>
            <img class={style.headerWatch} src="/assets/watch1.png" />
            <h1 data-tip={`Version: ${APPVERSION}`}>Krono</h1>
            <nav>
                <NavLink class={style.headerNav} href="/">
                    Home
                </NavLink>
                <Show when={roomName().length > 0}>
                    <NavLink class={[style.headerRoom, style.headerNav, "active"].join(" ")} href="">
                        {roomName}
                    </NavLink>
                </Show>
                <Show
                    when={siteUser()}
                    fallback={
                        <NavLink class={[style.headerNav, style.headerRight].join(" ")} href="/login">
                            Login
                        </NavLink>
                    }
                >
                    <NavLink class={[style.headerNav, style.headerRight].join(" ")} href="/profile">
                        Profile
                        <img class={style.headerUserIcon} src={siteUser()?.picture} referrerpolicy="no-referrer" />
                    </NavLink>
                </Show>
            </nav>
        </header>
    );
}
