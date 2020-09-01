import { h, JSX } from "preact";
import { useState, useEffect } from "preact/hooks";
import * as style from "./style.css";

type notificationType = "info" | "error";

interface NotificationObject {
    id: Date;
    text: string;
    type: notificationType;
    timeout: number;
    rendering: boolean;
}

let notificationList: NotificationObject[] = [];
let updateRender: (() => void) | null;

function popNotification(): void {
    notificationList = notificationList.slice(1);
    updateRender?.();
}

export function RegisterNotification(text: string, type: notificationType): void {
    const id = new Date();
    notificationList.push({
        id,
        text,
        type,
        timeout: type === "info" ? 1500 : 3000,
        rendering: false
    });
    updateRender?.();
}

function getTypeClass(note: NotificationObject): string {
    switch (note.type) {
        case "info":
            return style.notificationInfo;
        case "error":
            return style.notificationError;
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
    const color = getTypeClass(newestNote);
    if (!newestNote.rendering) {
        newestNote.rendering = true;
        setTimeout(popNotification, newestNote.timeout);
    }
    return <div class={[style.NotificationBackground, color].join(" ")}>{newestNote.text}</div>;
}
