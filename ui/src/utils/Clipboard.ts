import { RegisterNotification } from "../components/Notification";

export function CopyToClipboard(text: string, label: string): void {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    RegisterNotification(`${label} Copied to Clipboard`, "info");
}
