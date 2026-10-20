"use client";
import { ChangeEvent, ComponentProps, ElementType, forwardRef } from "react";
import { ErrorMessage, fieldClasses } from "./utils";

export type TextInputProps = Omit<ComponentProps<"input">, "ref"> & {
    onValueChange?: (value: string) => void,
    error?: boolean,
    errorMessage?: string,
    // left icon component (e.g. a react-icons icon)
    icon?: ElementType,
};

// forwardRef so react-hook-form's {...register("field")} works
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
    { onValueChange, onChange, error, errorMessage, icon: Icon, className = "", disabled, type = "text", ...props },
    ref
) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange?.(e);
        onValueChange?.(e.target.value);
    };

    return (
        <div className={`w-full ${className}`}>
            <div className="relative">
                {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />}
                <input
                    ref={ref}
                    type={type}
                    disabled={disabled}
                    aria-invalid={error || undefined}
                    onChange={handleChange}
                    className={`${fieldClasses(error, disabled)} h-10 pointer-coarse:min-h-[44px] px-3 ${Icon ? "pl-9" : ""}`}
                    {...props}
                />
            </div>
            {error && <ErrorMessage message={errorMessage} />}
        </div>
    );
});

export default TextInput;
