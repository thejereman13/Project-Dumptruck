import { useRef, useEffect } from "preact/hooks";

export function useAbortController(): AbortController {
    const controller = useRef(new AbortController());

    useEffect(() => {
        controller.current = new AbortController();
        return (): void => controller.current?.abort();
    }, []);
    return controller.current;
}
