import NextLink from "next/link";
import { ComponentProps, ReactNode } from "react";
import Spinner from "./Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "dark";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
    primary: "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-500",
    secondary: "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 shadow-xs hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-slate-400",
    danger: "bg-white text-red-600 ring-1 ring-inset ring-red-200 shadow-xs hover:bg-red-50 active:bg-red-100 focus-visible:ring-red-400",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:ring-slate-400",
    dark: "bg-slate-900 text-white shadow-xs hover:bg-slate-800 active:bg-slate-950 focus-visible:ring-slate-500",
};

// every size keeps a 44px touch target on touch screens
const sizes: Record<Size, string> = {
    sm: "min-h-[36px] pointer-coarse:min-h-[44px] px-3 text-sm gap-1.5",
    md: "min-h-[40px] pointer-coarse:min-h-[44px] px-4 text-sm gap-2",
    lg: "min-h-[48px] px-5 text-base gap-2",
};

type CommonProps = {
    variant?: Variant,
    size?: Size,
    icon?: ReactNode,
    loading?: boolean,
    fullWidth?: boolean,
    children?: ReactNode,
    className?: string
};

const classes = ({ variant = "primary", size = "md", fullWidth, className }: CommonProps) => `
    inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap select-none
    transition-colors duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:pointer-events-none disabled:opacity-50
    ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className ?? ""}
`;

type ButtonProps = CommonProps & Omit<ComponentProps<"button">, keyof CommonProps>;

export default function Button({ variant, size, icon, loading, fullWidth, className, children, type = "button", disabled, ...props }: ButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={classes({ variant, size, fullWidth, className })}
            {...props}
        >
            {loading ? <Spinner /> : icon}
            {children}
        </button>
    );
}

type LinkButtonProps = CommonProps & { href: string } & Omit<ComponentProps<typeof NextLink>, keyof CommonProps | "href">;

export function ButtonLink({ variant, size, icon, fullWidth, className, children, href, ...props }: LinkButtonProps) {
    return (
        <NextLink href={href} className={classes({ variant, size, fullWidth, className })} {...props}>
            {icon}
            {children}
        </NextLink>
    );
}
