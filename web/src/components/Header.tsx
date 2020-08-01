import { JSX, h } from "preact";
import { Link } from "preact-router/match";
import * as style from "./style.css";
import { useGAPIContext } from "../utils/GAPI";

export function Header(): JSX.Element {
    const currentAPI = useGAPIContext();

    return (
        <header class={style.header}>
            <h1>Dumptruck FM</h1>
            <nav>
                <Link class={style.headerNav} activeClassName={style.active} href="/">
                    Home
                </Link>
                <Link
                    class={style.headerNav}
                    activeClassName={style.active}
                    href={`/room/${Math.round(Math.random() * 1000) + 1}`}
                >
                    Create Room
                </Link>
                {currentAPI?.getUser() ? (
                    <Link
                        class={[style.headerNav, style.headerRight].join(" ")}
                        activeClassName={style.active}
                        href="/profile"
                    >
                        Profile
                        <img class={style.headerUserIcon} src={currentAPI.getUser()?.profileURL} />
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
