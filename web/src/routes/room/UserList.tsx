import { h, JSX } from "preact";
import Button from "preact-mui/lib/button";
import { Dropdown } from "../../components/Dropdown";
import { RoomUser } from "../../utils/BackendTypes";

import * as style from "./style.css";

export interface UserListProps {
    currentUsers: RoomUser[];
    adminList: string[];
    isAdmin: boolean;
    userID: string;
    addAdmin: (id: string) => void;
    removeAdmin: (id: string) => void;
}

export function UserList(props: UserListProps): JSX.Element {
    const { currentUsers, adminList, isAdmin, userID, addAdmin, removeAdmin } = props;

    return (
        <div class={style.scrollBox}>
            <h2>Current Users:</h2>
            {currentUsers.map(usr => {
                const hasAdmin = adminList.includes(usr.clientID);
                const isSelf = usr.clientID === userID;
                return (
                    <div class={style.UserRow} key={usr.clientID}>
                        <div class={[style.UserRowTitle, "mui--text-title", hasAdmin ? style.AdminName : ""].join(" ")}>
                            {usr.name}
                        </div>
                        {!isSelf && isAdmin && usr.userCount !== 0 && (
                            <Dropdown
                                base={(open): JSX.Element => (
                                    <Button onClick={open} size="small" variant="fab" color="accent">
                                        <i style={{ fontSize: "32px" }} class="material-icons">
                                            more_vert
                                        </i>
                                    </Button>
                                )}
                                options={[
                                    {
                                        display: hasAdmin ? "Remove Admin" : "Make Admin",
                                        onClick: (): void => {
                                            if (hasAdmin) removeAdmin(usr.clientID);
                                            else addAdmin(usr.clientID);
                                        }
                                    },
                                    {
                                        display: "Revoke Permissions"
                                    }
                                ]}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
