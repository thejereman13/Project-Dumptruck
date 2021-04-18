import { h, JSX } from "preact";
import Button from "preact-mui/lib/button";
import * as style from "./style.css";
import { usePopper } from "react-popper";
import { useState, useCallback } from "preact/hooks";
import { createPortal } from "preact/compat";
import { useAbortController } from "../utils/AbortController";

export interface DropdownOptionProps {
    className?: string;
    display: JSX.Element | string;
    onClick?: (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

function DropdownOption(props: DropdownOptionProps): JSX.Element {
    const { display, onClick, className } = props;
    return (
        <Button
            className={["mui-btn", "mui-btn--flat", className ?? "", style.DropdownOption].join(" ")}
            onClick={onClick}
        >
            {display}
        </Button>
    );
}

export interface DropdownProps {
    className?: string;
    base: (open: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void) => JSX.Element;
    options: DropdownOptionProps[];
    onClose?: () => void;
}

export function Dropdown(props: DropdownProps): JSX.Element {
    const { base, options, className, onClose } = props;
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

    const [open, setMenuOpen] = useState(false);
    const openMenu = useCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        setMenuOpen(true);
        event.stopPropagation();
        event.preventDefault();
    }, []);
    const closeMenu = useCallback((): void => {
        setMenuOpen(false);
        onClose?.();
    }, [onClose]);

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
                {options.map((opt, ind) => (
                    <DropdownOption
                        key={ind}
                        {...opt}
                        onClick={(): void => {
                            setMenuOpen(false);
                            opt.onClick?.();
                        }}
                    />
                ))}
            </div>,
            containerElement
        );
    const clickOff =
        containerElement &&
        open &&
        createPortal(<div onClick={closeMenu} className={style.DropdownBackdrop} />, containerElement);

    return (
        <div className={className} ref={setReferenceRef}>
            {base(openMenu)}
            {portal}
            {clickOff}
        </div>
    );
}
