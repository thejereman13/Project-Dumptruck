/* eslint-disable react/prop-types */
import { JSX, h } from "preact";
import Menu from "preact-material-components/Menu";
import Elevation from "preact-material-components/Elevation";
import * as style from "./style.css";

export interface DropdownMenuProps {
    open: boolean;
}

export function DropdownMenu({ open }: DropdownMenuProps): JSX.Element {
    return open ? (
        <Elevation class={style.dropdownMenu} z={8}>
            <Menu onCancel={() => console.log('cancel')} onMenuClosed={() => console.log('close')} onSelect={e => console.log(e)}>
                <Menu.Item>Option 1</Menu.Item>
                <Menu.Item>Option 2</Menu.Item>
            </Menu>
        </Elevation>
    ) : (
        <div />
    );
}
