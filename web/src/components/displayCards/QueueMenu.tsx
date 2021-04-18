import { h } from "preact";
import Button from "preact-mui/lib/button";
import { MdMoreVert } from "react-icons/md";
import { Dropdown } from "../Dropdown";

interface VideoQueueMenuProps {
    queueEnd: () => void;
    queueFront: () => void;
}

export function VideoQueueMenu(props: VideoQueueMenuProps): JSX.Element {
    const { queueFront, queueEnd } = props;
    return (
        <Dropdown
            base={(open): JSX.Element => (
                <Button onClick={open} size="small" variant="fab" color="accent">
                    <MdMoreVert size="2rem" />
                </Button>
            )}
            options={[
                {
                    display: "Queue Next",
                    onClick: queueFront
                },
                {
                    display: "Queue Last",
                    onClick: queueEnd
                }
            ]}
        />
    );
}
