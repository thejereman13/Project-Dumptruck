import { h, JSX } from "preact";
import Button from "preact-mui/lib/button";
import { Tooltip } from "../../components/Popup";
import { CopyToClipboard } from "../../utils/Clipboard";

import * as style from "./style.css";

export interface RoomTitleBarProps {
    isAdmin: boolean;
    roomTitle: string;
}

export function RoomTitleBar(props: RoomTitleBarProps): JSX.Element {
    const { isAdmin, roomTitle } = props;
    return (
        <div class={["mui--text-display1", style.centerTooltipChild, style.RoomTitleBar].join(" ")}>
            {roomTitle}
            {roomTitle && (
                <Tooltip className={[style.centerTooltipChild, style.settingButton].join(" ")} content="Share Room URL">
                    <Button
                        size="small"
                        variant="fab"
                        color="accent"
                        onClick={(): void => CopyToClipboard(document.URL, "Room URL")}
                    >
                        <i style={{ fontSize: "28px" }} class="material-icons">
                            share
                        </i>
                    </Button>
                </Tooltip>
            )}
            {isAdmin && (
                <Tooltip
                    className={[style.centerTooltipChild, style.settingButton].join(" ")}
                    content="Edit Room Settings"
                >
                    <Button
                        size="small"
                        variant="fab"
                        color="accent"
                        onClick={(): string => (window.location.href = "#RoomSettings")}
                    >
                        <i style={{ fontSize: "28px" }} class="material-icons">
                            settings
                        </i>
                    </Button>
                </Tooltip>
            )}
        </div>
    );
}
