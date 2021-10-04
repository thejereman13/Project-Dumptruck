import { css } from "@linaria/core";
import { h, JSX } from "preact";
import { useEffect } from "preact/hooks";

const style = {
    modalOverlay: css`
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(0, 0, 0, 0.25);
        transition: opacity 100ms;
        visibility: hidden;
        opacity: 0;
        z-index: 1024;
        &:target {
            visibility: visible;
            opacity: 1;
        }
    `,
    modalCancel: css`
        position: absolute;
        width: 100%;
        height: 100%;
        cursor: default;
    `,
};

export interface ModalProps {
    idName: string;
    className?: string;
    children: JSX.Element | JSX.Element[];
    onClose?: () => void;
}

export function Modal(props: ModalProps): JSX.Element {
    const { children, idName, className, onClose } = props;
    return (
        <div id={idName} class={style.modalOverlay}>
            <a class={style.modalOverlay} href="#" onClick={onClose}></a>
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
