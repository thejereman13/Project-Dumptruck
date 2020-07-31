import { JSX, h } from "preact";
import { Link } from "preact-router/match";
import * as style from "./style.css";

export function Header(): JSX.Element {
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
                <Link class={style.headerNav} activeClassName={style.active} href="/profile">
                    Profile
                </Link>
            </nav>
        </header>
    );
}
