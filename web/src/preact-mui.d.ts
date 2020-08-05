declare module "preact-mui/lib/button" {
    import { ButtonProps } from "@types/muicss/react";
    export default class Button extends React.Component<ButtonProps> {}
}

declare module "preact-mui/lib/input" {
    import { InputProps } from "@types/muicss/react";
    export default class Input extends React.Component<InputProps> {}
}

declare module "preact-mui/lib/modal" {
    import { DivProps } from "@types/muicss/react";
    export interface ModalProps extends DivProps {
        openedBy?: string;
        closedBy?: string;
        onClose: () => void;
        position: "center" | "centerLeft" | "centerRight" | "centerTop" | "centerBottom";
    }
    export default class Modal extends React.Component<ModalProps> {}
}

declare module "preact-mui/lib/container" {
    import { ContainerProps } from "@types/muicss/react";
    export default class Container extends React.Component<ContainerProps> {}
}
