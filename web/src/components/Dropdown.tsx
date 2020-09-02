import { h, JSX } from "preact";
import Button from "preact-mui/lib/button";
import * as style from "./style.css";
import { usePopper } from "react-popper";
import { useState, useCallback } from "preact/hooks";
import { createPortal } from "preact/compat";
import { useAbortController } from "./AbortController";

export interface DropdownOptionProps {
    className?: string;
    children: JSX.Element | string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export function DropdownOption(props: DropdownOptionProps): JSX.Element {
    const { children, onClick, className } = props;
    return (
        <Button
            className={["mui-btn", "mui-btn--flat", className ?? "", style.DropdownOption].join(" ")}
            onClick={onClick}
        >
            {children}
        </Button>
    );
}

export interface DropdownProps {
    className?: string;
    base: JSX.Element;
    children: JSX.Element[];
    open: boolean;
    onClose?: () => void;
}

export function Dropdown(props: DropdownProps): JSX.Element {
    const { base, children, className, onClose, open } = props;
    const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
    const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
    const { styles, attributes } = usePopper(referenceElement, popperElement, { placement: "bottom-end" });

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
                {children}
            </div>,
            containerElement
        );
    const clickOff =
        containerElement &&
        open &&
        createPortal(<div onClick={onClose} className={style.DropdownBackdrop} />, containerElement);

    return (
        <div className={className} ref={setReferenceRef}>
            {base}
            {portal}
            {clickOff}
        </div>
    );
}
