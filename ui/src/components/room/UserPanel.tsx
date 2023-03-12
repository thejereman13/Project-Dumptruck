import { For, JSX, Show } from "solid-js";
import { RoomUser } from "../../utils/BackendTypes";
import { css } from "solid-styled-components";
import { FiMoreVertical } from "solid-icons/fi";
import { style as commonStyle } from "./panelStyle";

const style = {
    AdminName: css`
        color: var(--theme-secondary-light) !important;
    `,
    UserRow: css`
        display: flex;
        justify-content: space-between;
    `,
    userContainer: css`
        padding: 1rem;
    `,
};

export interface UserListProps {
    currentUsers: RoomUser[];
    adminList: string[];
    isAdmin: boolean;
    userID: string;
    addAdmin: (id: string) => void;
    removeAdmin: (id: string) => void;
}

export function UserList(props: UserListProps): JSX.Element {
    return (
        <div class={[style.userContainer, commonStyle.scrollBox].join(" ")}>
            <h2>Current Users:</h2>
            <For each={props.currentUsers}>
                {(usr) => {
                    const hasAdmin = () => props.adminList.includes(usr.clientID);
                    const isSelf = () => usr.clientID === props.userID;
                    return (
                        <div class={style.UserRow}>
                            <div
                                classList={{
                                    "leading-9": true,
                                    [style.AdminName]: hasAdmin(),
                                }}
                            >
                                {usr.name}
                            </div>
                            <Show when={/*!isSelf() && */props.isAdmin && usr.userCount !== 0}>
                                <div class="dropdown dropdown-end">
                                    <label tabindex="0" class="btn btn-circle btn-sm btn-ghost btn-secondary">
                                        <FiMoreVertical size="1.5rem" />
                                    </label>
                                    <ul tabindex="0" class="dropdown-content menu rounded-lg">
                                        <li class="text-sm">
                                            <a
                                                onClick={() => {
                                                    if (hasAdmin()) props.removeAdmin(usr.clientID);
                                                    else props.addAdmin(usr.clientID);
                                                }}
                                            >
                                                <Show when={hasAdmin()} fallback="Make Admin">
                                                    Remove Admin
                                                </Show>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </Show>
                        </div>
                    );
                }}
            </For>
        </div>
    );
}
