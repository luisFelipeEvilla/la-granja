"use client";
import { Switch as HeadlessSwitch } from "@headlessui/react";

export type SwitchProps = {
    checked?: boolean,
    onChange?: (checked: boolean) => void,
    disabled?: boolean,
    id?: string,
    "aria-label"?: string,
    // kept for compatibility with Tremor's API; the switch always uses the brand color
    color?: string,
    className?: string
};

export function Switch({ checked = false, onChange, disabled, id, className = "", "aria-label": ariaLabel }: SwitchProps) {
    return (
        <HeadlessSwitch
            id={id}
            checked={checked}
            onChange={(next) => onChange?.(next)}
            disabled={disabled}
            aria-label={ariaLabel}
            className={`group relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-slate-200 transition-colors duration-200
                focus:outline-hidden data-checked:bg-emerald-600 data-focus:ring-2 data-focus:ring-emerald-500 data-focus:ring-offset-2
                data-disabled:cursor-not-allowed data-disabled:opacity-50
                before:absolute before:-inset-2.5 before:content-[''] pointer-coarse:before:-inset-3 ${className}`}
        >
            <span
                aria-hidden="true"
                className="pointer-events-none inline-block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 group-data-checked:translate-x-[22px]"
            />
        </HeadlessSwitch>
    );
}

export default Switch;
