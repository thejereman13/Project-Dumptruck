function setCookie(cname: string, cvalue: any): void {
    const d = new Date();
    d.setTime(d.getTime() + 1000 * 24 * 3600 * 1000);
    document.cookie = `${cname}=${cvalue};expires=${d.toUTCString()};path=/`;
}
function getCookie(cname: string): string | null {
    const name = `${cname}=`;
    const v = document.cookie.split(";").reduce((p, c): string => {
        if (p.length > 0) return p;
        const tc = c.trimLeft();
        if (tc.startsWith(name)) {
            return tc.substring(name.length, tc.length);
        }
        return "";
    }, "");
    if (v.length > 0) return v;
    return null;
}

export function setVolumeCookie(volume: number): void {
    setCookie("playerVolume", volume);
}
export function getVolumeCookie(): number {
    const vol = getCookie("playerVolume");
    if (vol !== null) return Number.parseInt(vol);
    return -1;
}

export function setSidebarCookie(tab: number): void {
    setCookie("sidebarTab", tab);
}
export function getSidebarCookie(): number {
    const val = getCookie("sidebarTab");
    if (val !== null) return Number.parseInt(val);
    return 0;
}

export function setSortCookie(order: number): void {
    setCookie("playlistSort", order);
}
export function getSortCookie(): number {
    const val = getCookie("playlistSort");
    if (val !== null) return Number.parseInt(val);
    return 0;
}
