import { FunctionalComponent, h, JSX } from "preact";
import { Link } from "preact-router/match";
import * as style from "./style.css";

export const NotFound: FunctionalComponent = (): JSX.Element => {
    return (
        <div class={style.notfound}>
            <h1>Error 404</h1>
            <p>That page doesn&apos;t exist.</p>
            <Link href="/">
                <h4>Back to Home</h4>
            </Link>
        </div>
    );
};
