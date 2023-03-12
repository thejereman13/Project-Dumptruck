import { debugOwnerComputations } from "@solid-devtools/logger";
import { JSX, createSignal, Show } from "solid-js";
import { produce } from "solid-js/store";
import { css } from "solid-styled-components";
import { BlockLoader } from "./LoadingAnimations";

const style = {
    notificationBackground: css`
        border-radius: 0.5rem;
        padding: 0.5rem;
        display: flex;
        max-width: 24rem;
        font-size: 1rem;
        transition: all 0.3s ease;
        position: absolute;
        right: 1rem;
        bottom: 1rem;
        z-index: 1024;
    `,
    notificationText: css`
        display: flex;
        align-items: center;
    `,
    notificationHide: css`
        opacity: 0;
    `,
    notificationError: css`
        background-color: var(--theme-error);
    `,
    notificationInfo: css`
        background-color: var(--theme-primary);
    `,
    notificationLoading: css`
        background-color: var(--theme-primary);
    `,
}

type notificationType = "info" | "error" | "loading";

interface NotificationObject {
    id: Date;
    text: string;
    type: notificationType;
    timeout: number;
    renderState: number; // 0: not rendered yet, 1: rendering, 2: hiding
}

let [notificationList, setNotificationList] = createSignal<NotificationObject[]>([]);

function popNotification(): void {
    setNotificationList((list) => list.slice(1));
}
function hideNotification(): void {
    setTimeout(popNotification, 800); // transition is 0.3s long
    setNotificationList(produce((list) => {
        let l0 = list[0];
        if (l0) {
            l0.renderState++;
        }
        list[0] = l0;
        return list;
    }));
}

export function RegisterNotification(text: string, type: notificationType): void {
    const id = new Date();
    setNotificationList(produce((list) => {
        list.push({
            id,
            text,
            type,
            timeout: type === "info" ? 2000 : 5000,
            renderState: 0
        });
        return list;
    }));
}

export function RegisterLoadingNotification(text: string): () => void {
    RegisterNotification(text, "loading");
    return hideNotification;
}

function getTypeClass(note: NotificationObject): string {
    switch (note.type) {
        case "info":
            return style.notificationInfo;
        case "error":
            return style.notificationError;
        case "loading":
            return style.notificationLoading;
        default:
            return "";
    }
}

export function RenderAllNotifications(): JSX.Element {
    const newestNote = () => notificationList()[0];
    const notificationColor = () => {
        let color = `${style.notificationBackground} ${getTypeClass(newestNote())}`;
        if (newestNote().renderState === 0) {
            newestNote().renderState++;
            if (newestNote().type !== "loading") {
                setTimeout(hideNotification, newestNote().timeout);
            }
        } else if (newestNote().renderState === 2) {
            color += ` ${style.notificationHide}`;
        }
        return color;
    };
    return (
        <Show when={notificationList().length > 0} fallback={<div />}>
            <div class={notificationColor()}>
                <div class={style.notificationText}>{newestNote().text}</div>
                {newestNote().type === "loading" && <BlockLoader />}
            </div>
        </Show>
    );
}
