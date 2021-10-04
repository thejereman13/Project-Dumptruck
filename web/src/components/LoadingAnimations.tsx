import { css } from "@linaria/core";
import { h, JSX } from "preact";

const style = {
    blockLoader: css`
        width: 50px;
        height: 30px;
        text-align: center;
        font-size: 10px;
        margin-left: 1rem;
        & > div {
            background-color: var(--theme-primary-light);
            height: 100%;
            width: 6px;
            margin-right: 3px;
            display: inline-block;

            -webkit-animation: sk-stretchdelay 1.2s infinite ease-in-out;
            animation: sk-stretchdelay 1.2s infinite ease-in-out;
        }

        @keyframes sk-stretchdelay {
            0%,
            40%,
            100% {
                transform: scaleY(0.4);
                -webkit-transform: scaleY(0.4);
            }
            20% {
                transform: scaleY(1);
                -webkit-transform: scaleY(1);
            }
        }
    `,
    // No clue why the css specificity order is being ignored here
    rect2: css`
        -webkit-animation-delay: -1.1s !important;
        animation-delay: -1.1s !important;
    `,
    rect3: css`
        -webkit-animation-delay: -1s !important;
        animation-delay: -1s !important;
    `,
    rect4: css`
        -webkit-animation-delay: -0.9s !important;
        animation-delay: -0.9s !important;
    `,
    rect5: css`
        -webkit-animation-delay: -0.8s !important;
        animation-delay: -0.8s !important;
    `,
    dotLoader: css`
        width: 70px;
        text-align: center;
        margin-left: 2rem;
        & > div {
            width: 16px;
            height: 16px;
            background-color: var(--theme-primary);
            margin-right: 6px;
            border-radius: 100%;
            display: inline-block;
            -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;
            animation: sk-bouncedelay 1.4s infinite ease-in-out both;
        }

        @keyframes sk-bouncedelay {
            0%,
            80%,
            100% {
                -webkit-transform: scale(0);
                transform: scale(0);
            }
            40% {
                -webkit-transform: scale(1);
                transform: scale(1);
            }
        }
    `,
    bounce1: css`
        -webkit-animation-delay: -0.32s !important;
        animation-delay: -0.32s !important;
    `,
    bounce2: css`
        -webkit-animation-delay: -0.16s !important;
        animation-delay: -0.16s !important;
    `,
};

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
