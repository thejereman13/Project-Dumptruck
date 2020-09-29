import { h, JSX } from "preact";
import { RoomUser } from "../../utils/BackendTypes";

import * as style from "./style.css";

export interface UserListProps {
    currentUsers: RoomUser[];
    adminList: string[];
}

export function UserList(props: UserListProps): JSX.Element {
    const { currentUsers, adminList } = props;

    return (
        <div>
            <h2>Current Users:</h2>
            {currentUsers.map(usr => (
                <div
                    class={["mui--text-title", adminList.includes(usr.clientID) ? style.AdminName : ""].join(" ")}
                    key={usr.clientID}
                >
                    {usr.name}
                </div>
            ))}
        </div>
    );
}
