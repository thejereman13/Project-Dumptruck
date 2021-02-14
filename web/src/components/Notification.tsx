import { h, JSX } from "preact";
import { useState, useEffect } from "preact/hooks";
import { BlockLoader } from "./LoadingAnimations";
import * as style from "./Notification.css";

type notificationType = "info" | "error" | "loading";

interface NotificationObject {
    id: Date;
    text: string;
    type: notificationType;
    timeout: number;
    renderState: number; // 0: not rendered yet, 1: rendering, 2: hiding
}

let notificationList: NotificationObject[] = [];
let updateRender: (() => void) | null;

function popNotification(): void {
    notificationList = notificationList.slice(1);
    updateRender?.();
}
function hideNotification(): void {
    notificationList[0].renderState++;
    setTimeout(popNotification, 800); // transition is 0.3s long
    updateRender?.();
}

export function RegisterNotification(text: string, type: notificationType): void {
    const id = new Date();
    notificationList.push({
        id,
        text,
        type,
        timeout: type === "info" ? 2000 : 5000,
        renderState: 0
    });
    updateRender?.();
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
    const [, setIncrement] = useState(0);
    useEffect(() => {
        updateRender = (): void => setIncrement(val => val + 1);
        return (): void => {
            updateRender = null;
        };
    }, []);
    if (notificationList.length === 0) return <div />;
    const newestNote = notificationList[0];
    let color = getTypeClass(newestNote);
    if (newestNote.renderState === 0) {
        newestNote.renderState++;
        if (newestNote.type !== "loading") {
            setTimeout(hideNotification, newestNote.timeout);
        }
    } else if (newestNote.renderState === 2) {
        color += ` ${style.notificationHide}`;
    }
    return (
        <div className={[style.NotificationBackground, color].join(" ")}>
            <div className={style.NotificationText}>{newestNote.text}</div>
            {newestNote.type === "loading" && <BlockLoader />}
        </div>
    );
}
