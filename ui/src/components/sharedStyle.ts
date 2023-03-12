import { css } from "solid-styled-components";

export const style = {
    textEllipsis: css`
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    `,
    centerTooltipChild: css`
        display: inline-flex !important;
        align-items: center;
    `,
    dropdownContainer: css`
        flex-flow: column;
        display: flex;
        z-index: 2048;
        background-color: var(--dp8-surface);
        padding: 0.5rem 0;
        border-radius: 0.5rem;
        box-shadow: 0.2rem 0.4rem 0.8rem 0px rgba(0, 0, 0, 0.5);
    `,
    dropdownOption: css`
        height: auto;
        color: var(--text-secondary) !important;
        margin: 0 !important;
    `,
    dropdownBackdrop: css`
        z-index: 1024;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    `,
    videoActionDiv: css`
        margin-left: auto;
        display: flex;
        & button {
            margin: 0.5rem;
        }
    `,
};