import { h, JSX } from "preact";
import Button from "preact-mui/lib/button";
import { createPortal } from "preact/compat";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { usePopper } from "react-popper";
import { useAbortController } from "../utils/AbortController";
import MdVolumeUp from "@meronex/icons/md/MdVolumeUp";
import { style as sharedStyle } from "./sharedStyle";
import { css } from "@linaria/core";

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
}

const LOG_SLIDER = true;
const LOG_BASE = 1.5;

const computeLogVolume = (p: number) => {
    return Math.pow(p / 100, LOG_BASE) * 100;
};
const computeLogPercentage = (v: number) => {
    return Math.pow(10, Math.log10(v / 100) / LOG_BASE) * 100;
}

export interface VolumeSliderProps {
    disabled?: boolean;
    volume: number;
    setVolume: (level: number) => void;
}

export function VolumeSlider(props: VolumeSliderProps): JSX.Element {
    const { disabled, volume, setVolume } = props;

    const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
    const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
    const { styles, attributes } = usePopper(referenceElement, popperElement, { placement: "top" });

    const boxRef = useRef<HTMLDivElement>(null);
    const dragging = useRef<boolean>(false);

    const controller = useAbortController();

    const setPopperRef = useCallback(
        (r: HTMLDivElement | null): void => {
            if (!controller.current.signal.aborted) setPopperElement(r);
        },
        [controller]
    );
    const setReferenceRef = useCallback(
        (r: HTMLDivElement | null): void => {
            if (!controller.current.signal.aborted) setReferenceElement(r);
        },
        [controller]
    );

    const [open, setMenuOpen] = useState(false);
    const openMenu = useCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        setMenuOpen(true);
        event.stopPropagation();
    }, []);
    const closeMenu = useCallback((): void => {
        setMenuOpen(false);
        dragging.current = false;
    }, []);

    const updateVolume = useCallback(
        (e: MouseEvent): void => {
            if (dragging.current && boxRef.current) {
                const y = boxRef.current.getBoundingClientRect().y;
                const scale = 100 - Math.round(((e.clientY - y) / boxRef.current.clientHeight) * 100);
                let val = Math.max(1, Math.min(scale, 100));
                if (LOG_SLIDER) {
                    val = computeLogVolume(val);
                }
                setVolume(val);
            }
        },
        [setVolume]
    );

    const startDrag = useCallback(
        (e: MouseEvent) => {
            dragging.current = true;
            updateVolume(e);
        },
        [updateVolume]
    );
    const stopDragging = useCallback(() => {
        dragging.current = false;
    }, []);
    const dragSlider = useCallback(
        (e: MouseEvent): void => {
            updateVolume(e);
        },
        [updateVolume]
    );
    useEffect(() => {
        window.addEventListener("mouseup", stopDragging);
        return (): void => window.removeEventListener("mouseup", stopDragging);
    }, [stopDragging]);

    const containerElement = document.getElementById("app");
    const portal =
        containerElement &&
        open &&
        createPortal(
            <div
                ref={setPopperRef}
                className={sharedStyle.dropdownContainer}
                style={{
                    ...(styles.popper as { [key: string]: string | number })
                }}
                {...attributes.popper}
            >
                <div className={style.volumeBox} onMouseDown={startDrag} onMouseMove={dragSlider} ref={boxRef}>
                    <div className={style.volumeSlider} style={{ top: `${100 - (LOG_SLIDER ? computeLogPercentage(volume) : volume)}%` }} />
                </div>
            </div>,
            containerElement
        );
    const clickOff =
        containerElement &&
        open &&
        createPortal(<div onClick={closeMenu} className={sharedStyle.dropdownBackdrop} />, containerElement);

    return (
        <div ref={setReferenceRef}>
            <Button disabled={disabled} size="small" variant="fab" onClick={openMenu}>
                <MdVolumeUp size="2rem" />
            </Button>
            {portal}
            {clickOff}
        </div>
    );
}
