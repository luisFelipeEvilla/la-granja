"use client";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { createContext, ReactNode, useContext } from "react";
import { HiXMark } from "react-icons/hi2";

// NextUI-compatible modal (Modal / ModalContent / ModalHeader / ModalBody / ModalFooter) on Headless UI

type Size = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";

const sizes: Record<Size, string> = {
    sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-lg", xl: "sm:max-w-xl", "2xl": "sm:max-w-2xl",
    "3xl": "sm:max-w-3xl", "4xl": "sm:max-w-4xl", "5xl": "sm:max-w-5xl", full: "sm:max-w-none sm:m-4",
};

const backdrops = {
    blur: "bg-slate-950/40 backdrop-blur-sm",
    opaque: "bg-slate-950/50",
    transparent: "bg-transparent",
};

type ModalContextValue = { onClose: () => void, scrollInside: boolean, hideCloseButton: boolean };
const ModalContext = createContext<ModalContextValue>({ onClose: () => {}, scrollInside: false, hideCloseButton: false });

export type ModalProps = {
    isOpen: boolean,
    onClose: () => void,
    size?: Size,
    // accepted for NextUI compatibility: the modal is centered (bottom sheet on phones)
    placement?: string,
    backdrop?: keyof typeof backdrops,
    // "inside": the body scrolls and header/footer stay visible
    scrollBehavior?: "inside" | "outside" | "normal",
    hideCloseButton?: boolean,
    className?: string,
    classNames?: { base?: string, backdrop?: string },
    children?: ReactNode
};

export function Modal({
    isOpen, onClose, size = "md", backdrop = "opaque", scrollBehavior = "normal", hideCloseButton = false, className = "", classNames, children
}: ModalProps) {
    const scrollInside = scrollBehavior === "inside";

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop
                transition
                className={`fixed inset-0 transition-opacity duration-200 ease-out data-closed:opacity-0 ${backdrops[backdrop]} ${classNames?.backdrop ?? ""}`}
            />
            <div className={`fixed inset-0 overflow-y-auto ${scrollInside ? "sm:overflow-hidden" : ""}`}>
                <div className="flex min-h-full items-end justify-center sm:items-center sm:p-4">
                    <DialogPanel
                        transition
                        className={`relative flex w-full flex-col bg-white shadow-2xl ring-1 ring-slate-900/5
                            rounded-t-2xl pb-[env(safe-area-inset-bottom)] sm:rounded-2xl sm:pb-0
                            ${scrollInside ? "max-h-[85dvh]" : ""}
                            transition duration-200 ease-out data-closed:translate-y-6 data-closed:opacity-0 sm:data-closed:translate-y-0 sm:data-closed:scale-95
                            ${sizes[size]} ${className} ${classNames?.base ?? ""}`}
                    >
                        <ModalContext.Provider value={{ onClose, scrollInside, hideCloseButton }}>
                            {children}
                        </ModalContext.Provider>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}

// accepts a node or NextUI's render function: (onClose) => node
export function ModalContent({ children }: { children?: ReactNode | ((onClose: () => void) => ReactNode) }) {
    const { onClose, hideCloseButton } = useContext(ModalContext);

    return (
        <>
            {!hideCloseButton && (
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="absolute right-3 top-3 z-10 flex h-9 w-9 pointer-coarse:h-11 pointer-coarse:w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                    <HiXMark className="h-5 w-5" />
                </button>
            )}
            {typeof children === "function" ? children(onClose) : children}
        </>
    );
}

export function ModalHeader({ children, className = "" }: { children?: ReactNode, className?: string }) {
    return (
        <DialogTitle as="div" className={`shrink-0 px-5 pb-2 pr-14 pt-5 text-lg font-semibold text-slate-900 sm:px-6 ${className}`}>
            {children}
        </DialogTitle>
    );
}

export function ModalBody({ children, className = "" }: { children?: ReactNode, className?: string }) {
    const { scrollInside } = useContext(ModalContext);
    return (
        <div className={`px-5 py-2 sm:px-6 ${scrollInside ? "min-h-0 flex-1 overflow-y-auto" : ""} ${className}`}>
            {children}
        </div>
    );
}

export function ModalFooter({ children, className = "" }: { children?: ReactNode, className?: string }) {
    return (
        <div className={`flex shrink-0 items-center justify-end gap-2 px-5 pb-5 pt-3 sm:px-6 ${className}`}>
            {children}
        </div>
    );
}

export default Modal;
