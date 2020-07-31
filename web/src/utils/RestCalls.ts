import { SiteUser } from "./BackendTypes";

export async function GetCurrentUser(): Promise<SiteUser | null> {
    try {
        const resp = await fetch("/api/user");
        const json: SiteUser = await resp.json();
        if (json.id && json.id.length > 0) {
            return json;
        }
    } catch (e) {
        console.warn(e);
    }
    return null;
}
