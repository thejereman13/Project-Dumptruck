import { h, JSX } from "preact";
import * as style from "./loadingStyle.css";

export function BlockLoader(): JSX.Element {
    return (
        <div className={style.blockLoader}>
            <div></div>
            <div className={style.rect2}></div>
            <div className={style.rect3}></div>
            <div className={style.rect4}></div>
            <div className={style.rect5}></div>
        </div>
    );
}

export function DotLoader(): JSX.Element {
    return (
        <div className={style.dotLoader}>
            <div className={style.bounce1}></div>
            <div className={style.bounce2}></div>
            <div></div>
        </div>
    );
}
