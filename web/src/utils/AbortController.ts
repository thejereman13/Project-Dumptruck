import { useRef, useEffect, Ref } from "preact/hooks";

export function useAbortController(): Ref<AbortController> {
    const controller = useRef(new AbortController());

    useEffect(() => {
        controller.current = new AbortController();
        return (): void => {
            controller.current?.abort();
        };
    }, []);
    return controller;
}
