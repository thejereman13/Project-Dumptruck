import { h, JSX } from "preact";

export interface TabProps {
    index: number;
    tabIndex: number;
    children: JSX.Element;
}

export function Tab(props: TabProps): JSX.Element {
    const { index, tabIndex, children } = props;
    return index === tabIndex ? children : <div />;
}

export interface TabsProps {
    index: number;
    onIndex: (index: number) => void;
    tabNames: string[];
    justified?: boolean;
}

export function Tabs(props: TabsProps): JSX.Element {
    const { index, onIndex, tabNames, justified } = props;
    return (
        <ul class={`mui-tabs__bar${justified ? " mui-tabs__bar--justified" : ""}`}>
            {tabNames.map((tab, ind) => (
                <li key={ind} class={index === ind ? "mui--is-active" : ""}>
                    <a onClick={(): void => onIndex(ind)}>{tab}</a>
                </li>
            ))}
        </ul>
    );
}
