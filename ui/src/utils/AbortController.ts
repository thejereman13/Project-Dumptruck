import { onCleanup } from "solid-js";

export function useAbortController(): AbortController {
    const controller = new AbortController();

    onCleanup(() => {
        controller.abort();
    });
    return controller;
}
