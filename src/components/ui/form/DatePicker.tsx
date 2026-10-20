"use client";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Children, isValidElement, ReactElement, ReactNode, useEffect, useMemo, useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import { HiCalendarDays, HiCheck, HiChevronDown, HiXMark } from "react-icons/hi2";
import { formatPickerDate, formatPickerRange, startOfToday } from "./dates";

// shared look of the calendars (react-day-picker without its stylesheet, styled with Tailwind)
const calendarClassNames = {
    root: "relative text-sm text-slate-700",
    months: "relative flex flex-col gap-4 sm:flex-row",
    month: "space-y-3",
    month_caption: "flex h-10 items-center justify-center px-10",
    caption_label: "text-sm font-semibold capitalize text-slate-900",
    nav: "absolute inset-x-0 top-0 flex h-10 items-center justify-between",
    button_previous: "flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30",
    button_next: "flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30",
    chevron: "h-4 w-4 fill-current",
    month_grid: "border-collapse",
    weekdays: "flex",
    weekday: "w-10 text-center text-xs font-medium capitalize text-slate-400 pointer-coarse:w-11",
    week: "mt-1 flex",
    day: "h-10 w-10 p-0 text-center pointer-coarse:h-11 pointer-coarse:w-11",
    day_button: "h-full w-full rounded-lg tabular-nums transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
    today: "font-bold text-emerald-700 [&>button]:ring-1 [&>button]:ring-inset [&>button]:ring-emerald-300",
    selected: "[&>button]:bg-emerald-600 [&>button]:text-white [&>button]:hover:bg-emerald-700",
    range_start: "rounded-l-lg bg-emerald-50",
    range_end: "rounded-r-lg bg-emerald-50",
    range_middle: "bg-emerald-50 [&>button]:!bg-transparent [&>button]:!text-emerald-900 [&>button]:rounded-none",
    outside: "text-slate-300",
    disabled: "text-slate-300 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent",
    hidden: "invisible",
};

const triggerBase = `flex h-10 min-h-10 w-full min-w-0 items-center gap-2 bg-white px-3 text-left text-sm shadow-xs
    ring-1 ring-inset ring-slate-300 transition-colors pointer-coarse:min-h-[44px]
    hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
    disabled:cursor-not-allowed disabled:opacity-50`;

const panelClass = "z-50 rounded-xl bg-white p-3 shadow-lg ring-1 ring-slate-900/10 [--anchor-gap:6px] focus:outline-none";

type DatePickerProps = {
    value?: Date,
    onValueChange?: (value: Date | undefined) => void,
    placeholder?: string,
    enableClear?: boolean,
    disabled?: boolean,
    minDate?: Date,
    maxDate?: Date,
    className?: string,
    // accepted for compatibility with Tremor's API; the calendar is always in Spanish
    locale?: unknown,
    id?: string,
};

export function DatePicker({
    value, onValueChange, placeholder = "Seleccionar fecha", enableClear = true,
    disabled, minDate, maxDate, className = "", id,
}: DatePickerProps) {
    const hidden = [
        ...(minDate ? [{ before: minDate }] : []),
        ...(maxDate ? [{ after: maxDate }] : []),
    ];

    return (
        <Popover className={`relative w-full min-w-0 ${className}`}>
            <div className="relative">
                <PopoverButton id={id} disabled={disabled} className={`${triggerBase} rounded-lg ${enableClear && value ? "pr-10" : ""}`}>
                    <HiCalendarDays className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className={`min-w-0 flex-1 truncate ${value ? "text-slate-900" : "text-slate-400"}`}>
                        {value ? formatPickerDate(value) : placeholder}
                    </span>
                </PopoverButton>
                {enableClear && value && !disabled && (
                    <button
                        type="button"
                        aria-label="Borrar fecha"
                        onClick={() => onValueChange?.(undefined)}
                        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <HiXMark className="h-4 w-4" />
                    </button>
                )}
            </div>
            <PopoverPanel anchor="bottom start" className={panelClass}>
                {({ close }) => (
                    <DayPicker
                        mode="single"
                        locale={es}
                        weekStartsOn={1}
                        selected={value}
                        defaultMonth={value}
                        disabled={hidden}
                        startMonth={minDate}
                        endMonth={maxDate}
                        onSelect={(day) => {
                            // tapping the selected day again would unselect it: keep a value unless clearing is allowed
                            if (!day && !enableClear) return close();
                            onValueChange?.(day);
                            close();
                        }}
                        classNames={calendarClassNames}
                    />
                )}
            </PopoverPanel>
        </Popover>
    );
}

export type DateRangePickerValue = { from?: Date, to?: Date, selectValue?: string };

type DateRangePickerItemProps = { value: string, from: Date, to?: Date, children?: ReactNode };

// preset marker read by DateRangePicker; renders nothing on its own
export function DateRangePickerItem(_props: DateRangePickerItemProps) {
    return null;
}

type DateRangePickerProps = {
    value?: DateRangePickerValue,
    onValueChange?: (value: DateRangePickerValue) => void,
    placeholder?: string,
    selectPlaceholder?: string,
    enableSelect?: boolean,
    enableClear?: boolean,
    className?: string,
    locale?: unknown,
    disabled?: boolean,
    children?: ReactNode,
};

// two months side by side only when the screen has room for them
function useTwoMonths() {
    const [twoMonths, setTwoMonths] = useState(false);
    useEffect(() => {
        const query = window.matchMedia("(min-width: 768px)");
        const update = () => setTwoMonths(query.matches);
        update();
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    }, []);
    return twoMonths;
}

export function DateRangePicker({
    value = {}, onValueChange, placeholder = "Seleccionar fechas", selectPlaceholder = "Período",
    enableSelect, enableClear = true, className = "", disabled, children,
}: DateRangePickerProps) {
    const twoMonths = useTwoMonths();

    const presets = useMemo(() => Children.toArray(children)
        .filter((child): child is ReactElement<DateRangePickerItemProps> => isValidElement(child))
        .map((child) => child.props), [children]);
    const showSelect = (enableSelect ?? presets.length > 0) && presets.length > 0;
    const activePreset = presets.find((preset) => preset.value === value.selectValue);

    const label = value.from ? formatPickerRange(value.from, value.to) : placeholder;
    const hasValue = Boolean(value.from || value.selectValue);

    const choosePreset = (presetValue: string) => {
        const preset = presets.find((item) => item.value === presetValue);
        if (preset) onValueChange?.({ from: preset.from, to: preset.to ?? startOfToday(), selectValue: preset.value });
    };

    return (
        <div className={`flex w-full min-w-0 ${className}`}>
            <Popover className="relative min-w-0 flex-1">
                <div className="relative">
                    <PopoverButton
                        disabled={disabled}
                        className={`${triggerBase} ${showSelect ? "rounded-l-lg" : "rounded-lg"} ${enableClear && hasValue ? "pr-10" : ""}`}
                    >
                        <HiCalendarDays className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                        <span className={`min-w-0 flex-1 truncate ${value.from ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
                    </PopoverButton>
                    {enableClear && hasValue && !disabled && (
                        <button
                            type="button"
                            aria-label="Borrar fechas"
                            onClick={() => onValueChange?.({})}
                            className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                            <HiXMark className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <PopoverPanel anchor="bottom start" className={panelClass}>
                    <DayPicker
                        mode="range"
                        locale={es}
                        weekStartsOn={1}
                        numberOfMonths={twoMonths ? 2 : 1}
                        selected={value.from ? { from: value.from, to: value.to } : undefined}
                        defaultMonth={value.from}
                        onSelect={(range: DateRange | undefined) => onValueChange?.({ from: range?.from, to: range?.to })}
                        classNames={calendarClassNames}
                    />
                </PopoverPanel>
            </Popover>

            {showSelect && (
                <Listbox value={value.selectValue ?? ""} onChange={choosePreset} disabled={disabled}>
                    <div className="relative -ml-px w-36 shrink-0 sm:w-44">
                        <ListboxButton className={`${triggerBase} rounded-r-lg justify-between`}>
                            <span className={`min-w-0 truncate whitespace-nowrap ${activePreset ? "text-slate-900" : "text-slate-400"}`}>
                                {activePreset?.children ?? selectPlaceholder}
                            </span>
                            <HiChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        </ListboxButton>
                        <ListboxOptions
                            anchor="bottom end"
                            className="z-50 min-w-[var(--button-width)] rounded-xl bg-white p-1 shadow-lg ring-1 ring-slate-900/10 [--anchor-gap:6px] focus:outline-none"
                        >
                            {presets.map((preset) => (
                                <ListboxOption
                                    key={preset.value}
                                    value={preset.value}
                                    className="group flex min-h-10 cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 data-[focus]:bg-slate-100 data-[selected]:font-semibold data-[selected]:text-emerald-700 pointer-coarse:min-h-[44px]"
                                >
                                    <HiCheck className="invisible h-4 w-4 shrink-0 group-data-[selected]:visible" aria-hidden="true" />
                                    <span className="whitespace-nowrap">{preset.children}</span>
                                </ListboxOption>
                            ))}
                        </ListboxOptions>
                    </div>
                </Listbox>
            )}
        </div>
    );
}
