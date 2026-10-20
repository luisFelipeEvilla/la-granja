"use client";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/react";
import { ReactNode } from "react";
import Button from "./Button";

type Props = {
    open: boolean,
    title: ReactNode,
    description?: ReactNode,
    confirmLabel?: string,
    tone?: "danger" | "primary",
    loading?: boolean,
    onConfirm: () => void,
    onClose: () => void
};

export default function ConfirmDialog({ open, title, description, confirmLabel = "Confirmar", tone = "danger", loading, onConfirm, onClose }: Props) {
    return (
        <Modal isOpen={open} onClose={onClose} placement="center" backdrop="blur" size="md">
            <ModalContent>
                <ModalHeader className="text-lg font-semibold text-slate-900">{title}</ModalHeader>
                {description && <ModalBody className="text-sm text-slate-600">{description}</ModalBody>}
                <ModalFooter>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button
                        variant={tone === "danger" ? "dark" : "primary"}
                        className={tone === "danger" ? "!bg-red-600 hover:!bg-red-700" : ""}
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmLabel}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
