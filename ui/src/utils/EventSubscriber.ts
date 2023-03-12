import { onMount, onCleanup } from "solid-js";

export type SubscriberCallback = (message: any) => void | Promise<void>;

const Subscriptions: Record<string, Record<number, SubscriberCallback>> = {};

let callbackID = 1;

export function NotifyChannel(channel: string, message: any): void {
    const subs = Subscriptions[channel];
    if (subs) {
        Object.values(subs).forEach((s) => void s(message));
    }
}

export function RegisterChannelCallback(channel: string, callback: SubscriberCallback): number {
    const subs = Subscriptions[channel];
    const id = callbackID++;
    if (subs) {
        subs[id] = callback;
    } else {
        Subscriptions[channel] = { [id]: callback };
    }
    return id;
}
export function UnregisterChannelCallback(channel: string, id: number): void {
    const subs = Subscriptions[channel];
    if (subs) {
        delete subs[id];
    }
}

export function useCallbackHook(channel: string, callback: SubscriberCallback): void {
    const id = RegisterChannelCallback(channel, callback);
    onCleanup(() => {
        UnregisterChannelCallback(channel, id);
    });
}
