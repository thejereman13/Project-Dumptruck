import { h, JSX } from "preact";
import { useState, useCallback, useRef } from "preact/hooks";
import { createPortal } from "preact/compat";
import { usePopper } from "react-popper";
import * as style from "./style.css";
import { useAbortController } from "./AbortController";

export interface PopupProps {
    content: JSX.Element | string;
    children?: JSX.Element;
    delay?: number;
    options?: Parameters<typeof usePopper>[2];
    className?: string;
}

export function Tooltip(props: PopupProps): JSX.Element {
    const { content, children, options, className, delay } = props;
    const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
    const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
    const [hoverActive, setHoverActive] = useState<boolean>(false);
    const [isVisible, setVisible] = useState<boolean>(false);
    const { styles, attributes } = usePopper(referenceElement, popperElement, {
        placement: "top",
        ...options
    });
    const controller = useAbortController();
    const active = useRef(false);

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

    const mouseEnter = useCallback(() => {
        setHoverActive(true);
        active.current = true;
        setTimeout(() => {
            if (active.current) setVisible(true);
        }, delay);
    }, [delay]);
    const mouseLeave = useCallback(() => {
        setHoverActive(false);
        setVisible(false);
        active.current = false;
    }, []);

    const containerElement = document.getElementById("app");
    const render = (
        <div ref={setReferenceRef} onMouseEnter={mouseEnter} onMouseLeave={mouseLeave}>
            {children}
        </div>
    );

    // This mounts a portal in the DOM for every single tooltip, regardless of whether it's currently visible
    // Perhaps this can be changed in the future without breaking transitions
    const portal =
        containerElement &&
        hoverActive &&
        createPortal(
            <div
                ref={setPopperRef}
                class={style.popupTooltip}
                style={{
                    ...(styles.popper as { [key: string]: string | number }),
                    opacity: isVisible ? 1 : 0
                }}
                {...attributes.popper}
            >
                {content}
            </div>,
            containerElement
        );

    return (
        <div className={className}>
            {portal}
            {render}
        </div>
    );
}
