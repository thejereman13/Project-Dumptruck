import { h, JSX } from "preact";
import Button from "preact-mui/lib/button";
import { createPortal } from "preact/compat";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { usePopper } from "react-popper";
import { useAbortController } from "./AbortController";

import * as style from "./style.css";

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
                const val = Math.max(0, Math.min(scale, 100));
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
                className={style.DropdownContainer}
                style={{
                    ...(styles.popper as { [key: string]: string | number })
                }}
                {...attributes.popper}
            >
                <div className={style.VolumeBox} onMouseDown={startDrag} onMouseMove={dragSlider} ref={boxRef}>
                    <div className={style.VolumeSlider} style={{ top: `${100 - volume}%` }} />
                </div>
            </div>,
            containerElement
        );
    const clickOff =
        containerElement &&
        open &&
        createPortal(<div onClick={closeMenu} className={style.DropdownBackdrop} />, containerElement);

    return (
        <div ref={setReferenceRef}>
            <Button disabled={disabled} size="small" variant="fab" onClick={openMenu}>
                <i style={{ fontSize: "2rem" }} class="material-icons">
                    volume_up
                </i>
            </Button>
            {portal}
            {clickOff}
        </div>
    );
}
