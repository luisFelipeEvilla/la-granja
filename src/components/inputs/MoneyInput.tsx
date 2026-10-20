"use client";
import { TextInput } from "@tremor/react";
import { ChangeEvent, ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof TextInput>, 'value' | 'onChange' | 'onValueChange' | 'type'> & {
    // digits only, e.g. "18000"
    value: string,
    onValueChange: (digits: string) => void
};

const formatThousands = (digits: string) =>
    digits ? new Intl.NumberFormat('es-CO').format(Number(digits)) : '';

// peso amount input: keeps digits in state and shows them with thousands separators ("18.000")
export default function MoneyInput({ value, onValueChange, ...props }: Props) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const caret = input.selectionStart ?? input.value.length;
        // digits typed before the caret, to put the caret back after reformatting
        const digitsBeforeCaret = input.value.slice(0, caret).replace(/\D/g, '').length;
        const digits = input.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');

        onValueChange(digits);

        requestAnimationFrame(() => {
            const formatted = input.value;
            let position = 0;
            for (let seen = 0; position < formatted.length && seen < digitsBeforeCaret; position++) {
                if (/\d/.test(formatted[position])) seen++;
            }
            input.setSelectionRange(position, position);
        });
    };

    return (
        <TextInput
            {...props}
            value={formatThousands(value)}
            onChange={handleChange}
            inputMode="numeric"
            onFocus={(e) => e.target.select()}
        />
    );
}
