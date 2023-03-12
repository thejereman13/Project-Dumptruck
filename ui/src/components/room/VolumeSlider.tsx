import { createSignal, JSX, onCleanup, onMount } from "solid-js";
import { css } from "solid-styled-components";
import { useAbortController } from "../../utils/AbortController";
import { IoVolumeMedium } from "solid-icons/io";

const style = {
    volumeBox: css`
        width: 2rem;
        height: 24rem;
        margin: 0 0.25rem;
        position: relative;
    `,
    volumeSlider: css`
        width: 100%;
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: var(--theme-primary);
        border-radius: 0.25rem;
    `,
};

const LOG_SLIDER = true;
const LOG_BASE = 1.5;

const computeLogVolume = (p: number) => {
    return Math.pow(p / 100, LOG_BASE) * 100;
};
const computeLogPercentage = (v: number) => {
    return Math.pow(10, Math.log10(v / 100) / LOG_BASE) * 100;
};

export interface VolumeSliderProps {
    disabled?: boolean;
    volume: number;
    setVolume: (level: number) => void;
}

export function VolumeSlider(props: VolumeSliderProps): JSX.Element {
    let boxRef: HTMLUListElement | null = null;
    let dragging = false;

    const updateVolume: JSX.EventHandler<HTMLUListElement, MouseEvent> = (e) => {
        if (dragging && boxRef) {
            const y = boxRef.getBoundingClientRect().y;
            const scale = 100 - Math.round(((e.clientY - y) / boxRef.clientHeight) * 100);
            let val = Math.max(1, Math.min(scale, 100));
            if (LOG_SLIDER) {
                val = computeLogVolume(val);
            }
            props.setVolume(val);
        }
    };

    const startDrag: JSX.EventHandler<HTMLUListElement, MouseEvent> = (e) => {
        dragging = true;
        updateVolume(e);
    };
    const stopDragging = () => {
        dragging = false;
    };
    onMount(() => {
        window.addEventListener("mouseup", stopDragging);
    });
    onCleanup(() => {
        window.removeEventListener("mouseup", stopDragging);
    });

    return (
        <div class="dropdown dropdown-top">
            <label tabIndex={0} classList={{ "btn btn-circle btn-primary": true, "btn-disabled": props.disabled }}>
                <IoVolumeMedium size="2rem" />
            </label>
            <ul
                ref={(r) => boxRef = r}
                tabindex={0}
                class="dropdown-content menu w-[2rem] h-[24rem] relative ml-2 mb-2 bg-neutral-700 rounded-md"
                onMouseDown={startDrag}
                onMouseMove={updateVolume}
            >
                <div
                    class={style.volumeSlider}
                    style={{ top: `${100 - (LOG_SLIDER ? computeLogPercentage(props.volume) : props.volume)}%` }}
                />
            </ul>
        </div>
    );
}
