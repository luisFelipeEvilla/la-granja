"use client";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { ReactNode } from "react";
import { HiCheck, HiChevronUpDown, HiXMark } from "react-icons/hi2";
import { ErrorMessage, fieldClasses, ItemProps, optionClasses, panelClasses, readOptions } from "./utils";

export type SelectProps = {
    value?: string,
    onValueChange?: (value: string) => void,
    placeholder?: string,
    // shows an "x" to clear the selection (sends "")
    enableClear?: boolean,
    disabled?: boolean,
    error?: boolean,
    errorMessage?: string,
    className?: string,
    id?: string,
    children?: ReactNode
};

// marker component: Select reads its props to build the options
export function SelectItem(_props: ItemProps) {
    return null;
}

export function Select({
    value = "", onValueChange, placeholder = "Seleccionar", enableClear = true, disabled, error, errorMessage, className = "", id, children
}: SelectProps) {
    const options = readOptions(children);
    const selected = options.find((option) => option.value === value);
    const showClear = enableClear && !!selected && !disabled;

    return (
        <div className={`w-full ${className}`}>
            <Listbox value={value} onChange={(next: string) => onValueChange?.(next)} disabled={disabled}>
                <div className="relative">
                    <ListboxButton
                        id={id}
                        aria-invalid={error || undefined}
                        className={`${fieldClasses(error, disabled)} flex h-10 pointer-coarse:min-h-[44px] items-center gap-2 pl-3 ${showClear ? "pr-16" : "pr-9"} text-left`}
                    >
                        {selected?.icon && <selected.icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />}
                        <span className={`min-w-0 flex-1 truncate ${selected ? "" : "text-slate-400"}`}>
                            {selected ? selected.label : placeholder}
                        </span>
                    </ListboxButton>
                    {showClear && (
                        <button
                            type="button"
                            onClick={() => onValueChange?.("")}
                            aria-label="Limpiar selección"
                            className="absolute right-8 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                            <HiXMark className="h-4 w-4" />
                        </button>
                    )}
                    <HiChevronUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                </div>
                <ListboxOptions anchor="bottom start" transition className={`${panelClasses} w-(--button-width) min-w-48`}>
                    {options.length === 0 && <p className="px-3 py-2 text-sm text-slate-500">Sin opciones</p>}
                    {options.map((option) => (
                        <ListboxOption key={option.value} value={option.value} disabled={option.disabled} className={optionClasses}>
                            {option.icon && <option.icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />}
                            <span className="min-w-0 flex-1 truncate">{option.label}</span>
                            <HiCheck className="invisible h-4 w-4 shrink-0 text-emerald-600 group-data-selected:visible" aria-hidden="true" />
                        </ListboxOption>
                    ))}
                </ListboxOptions>
            </Listbox>
            {error && <ErrorMessage message={errorMessage} />}
        </div>
    );
}

export default Select;
