export interface BlossomColorPickerProps {
    value?: `#${string}`;
    defaultValue?: `#${string}`;
    onChange?: (color: `#${string}`) => void;
    onDismiss?: (finalColor: `#${string}`) => void;
    portalContainer?: HTMLElement;
    disabled?: boolean;
    className?: string;
}
