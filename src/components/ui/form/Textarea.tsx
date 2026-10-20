"use client";
import { ChangeEvent, ComponentProps, forwardRef } from "react";
import { ErrorMessage, fieldClasses } from "./utils";

export type TextareaProps = Omit<ComponentProps<"textarea">, "ref"> & {
    onValueChange?: (value: string) => void,
    error?: boolean,
    errorMessage?: string,
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    { onValueChange, onChange, error, errorMessage, className = "", disabled, rows = 3, ...props },
    ref
) {
    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(e);
        onValueChange?.(e.target.value);
    };

    return (
        <div className={`w-full ${className}`}>
            <textarea
                ref={ref}
                rows={rows}
                disabled={disabled}
                aria-invalid={error || undefined}
                onChange={handleChange}
                className={`${fieldClasses(error, disabled)} block resize-y px-3 py-2`}
                {...props}
            />
            {error && <ErrorMessage message={errorMessage} />}
        </div>
    );
});

export default Textarea;
