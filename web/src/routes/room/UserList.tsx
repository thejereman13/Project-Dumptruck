import { h, JSX } from "preact";
import { RoomUser } from "../../utils/BackendTypes";

export interface UserListProps {
    currentUsers: RoomUser[];
}

export function UserList(props: UserListProps): JSX.Element {
    const { currentUsers } = props;

    return (
        <div>
            <h2>Current Users:</h2>
            {currentUsers.map(usr => (
                <div class="mui--text-title" key={usr.clientID}>
                    {usr.name}
                </div>
            ))}
        </div>
    );
}
