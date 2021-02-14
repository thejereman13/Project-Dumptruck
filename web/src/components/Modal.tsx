import { h, JSX } from "preact";
import { useEffect } from "preact/hooks";
import * as style from "./Modal.css";

export interface ModalProps {
    idName: string;
    className?: string;
    children: JSX.Element | JSX.Element[];
    onClose?: () => void;
}

export function Modal(props: ModalProps): JSX.Element {
    const { children, idName, className, onClose } = props;
    return (
        <div id={idName} class={style.ModalOverlay}>
            <a class={style.ModalCancel} href="#" onClick={onClose}></a>
            <div class={className}>{children}</div>
        </div>
    );
}

function navigateOut(event: KeyboardEvent): void {
    if (event.key === "Escape") window.location.href = "#";
}

export function useEscapeModal(): void {
    useEffect(() => {
        document.addEventListener("keydown", navigateOut);
        return (): void => {
            document.removeEventListener("keydown", navigateOut);
        };
    }, []);
}
