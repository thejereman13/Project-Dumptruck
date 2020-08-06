declare module "preact-mui/lib/button" {
    import { ButtonProps } from "@types/muicss/react";
    export default class Button extends React.Component<ButtonProps> {}
}

declare module "preact-mui/lib/input" {
    import { InputProps } from "@types/muicss/react";
    export default class Input extends React.Component<InputProps> {}
}

declare module "preact-mui/lib/container" {
    import { ContainerProps } from "@types/muicss/react";
    export default class Container extends React.Component<ContainerProps> {}
}
