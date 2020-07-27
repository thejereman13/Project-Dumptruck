import { JSX, h } from "preact";
import { Link } from "preact-router/match";
import { DropdownMenu } from "./DropdownMenu";
import Button from "preact-material-components/Button";
import * as style from "./style.css";
import { useState } from "preact/hooks";

export function Header(): JSX.Element {
    const [menu, setMenu] = useState(false);

    return (
        <header class={style.header}>
            <h1>Dumptruck FM</h1>
            <nav>
                <Link
                    class={style.headerNav}
                    activeClassName={style.active}
                    href="/"
                >
                    Home
                </Link>
                <Link
                    class={style.headerNav}
                    activeClassName={style.active}
                    href="/room"
                >
                    Create Room
                </Link>
                <Button
                    class={style.headerNav}
                    onClick={(): void => setMenu(!menu)}
                >
                    Settings
                </Button>
                <DropdownMenu open={menu} />
            </nav>
        </header>
    );
}
