import { h, JSX } from "preact";
import { useState, useCallback, useRef, useEffect } from "preact/hooks";
import { createPortal } from "preact/compat";
import { usePopper } from "react-popper";
import { useAbortController } from "../utils/AbortController";
import { css } from "@linaria/core";

const style = {
    popupTooltip: css`
        background-color: var(--dp16-surface);
        border-radius: 0.25rem;
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 1024;
    `
};

export interface PopupProps {
    content: JSX.Element | string;
    children?: JSX.Element;
    delay?: number;
    options?: Parameters<typeof usePopper>[2];
    className?: string;
    onClick?: (event: JSX.TargetedMouseEvent<HTMLDivElement>) => void;
}

export function Tooltip(props: PopupProps): JSX.Element {
    const { content, children, options, className, delay, onClick } = props;
    const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
    const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
    const [hoverActive, setHoverActive] = useState<boolean>(false);
    const [isVisible, setVisible] = useState<boolean>(false);
    const { styles, attributes } = usePopper(referenceElement, popperElement, {
        placement: "top",
        modifiers: [
            {
                name: "offset",
                options: {
                    offset: [0, 4] // 0.25rem at default sizing, unfortunately must specify a pixel value
                }
            }
        ],
        ...options
    });
    const controller = useAbortController();
    const active = useRef(false);
    useEffect(() => {
        return (): void => {
            active.current = false;
        };
    }, []);

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
        <div className={className} onClick={onClick}>
            {portal}
            {render}
        </div>
    );
}
