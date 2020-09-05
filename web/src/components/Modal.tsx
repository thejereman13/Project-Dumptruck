import { h, JSX } from "preact";
import { createPortal } from "preact/compat";
import * as style from "./style.css";

export interface ModalProps {
    container?: string;
    className?: string;
    open: boolean;
    children: JSX.Element | JSX.Element[];
    onClose?: () => void;
}

export function Modal(props: ModalProps): JSX.Element {
    const { children, container, open, className, onClose } = props;
    const containerElement = document.getElementById(container ?? "app");
    if (open && containerElement !== null)
        return createPortal(
            <div class={style.ModalBackground} onClick={onClose}>
                <div class={className}>{children}</div>
            </div>,
            containerElement
        );
    return <div />;
}
