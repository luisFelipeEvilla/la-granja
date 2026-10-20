"use client";
import { InvoiceAttachmentItem } from "@/types/Client";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Panel from "@/components/ui/Panel";
import Spinner from "@/components/ui/Spinner";
import { Modal, ModalBody, ModalContent } from "@/components/ui/Modal";
import { ChangeEvent, useRef, useState } from "react";
import { HiOutlineCamera, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineTrash } from "react-icons/hi2";
import toast from "react-hot-toast";

type Props = { invoiceId: string, attachments: InvoiceAttachmentItem[], onChange: () => void };

type Upload = { id: string, name: string, preview: string };

const MAX_SIDE = 1600;

export const formatDateTime = (date: Date | string) =>
    new Date(date).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });

const fileUrl = (id: string) => `/api/attachments/${id}/file`;

// draws the photo into a canvas (max 1600px on the longest side) and exports a JPEG;
// Safari decodes HEIC into the canvas, so iPad camera photos also work
async function compressImage(file: File): Promise<Blob> {
    const url = URL.createObjectURL(file);
    try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("No se pudo leer la imagen"));
            img.src = url;
        });

        const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);

        return await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo comprimir la imagen")), "image/jpeg", 0.8)
        );
    } finally {
        URL.revokeObjectURL(url);
    }
}

export default function EvidencePanel({ invoiceId, attachments, onChange }: Props) {
    const input = useRef<HTMLInputElement>(null);
    const [uploads, setUploads] = useState<Upload[]>([]);
    const [viewing, setViewing] = useState<number | null>(null);
    const [deleting, setDeleting] = useState<InvoiceAttachmentItem | null>(null);
    const [busy, setBusy] = useState(false);

    const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        if (files.length === 0) return;

        const pending = files.map((file, index) => ({ id: `${Date.now()}-${index}`, name: file.name, preview: URL.createObjectURL(file) }));
        setUploads((current) => [...current, ...pending]);

        let uploaded = 0;
        // one at a time: keeps memory low on the iPad and each request small
        for (let index = 0; index < files.length; index++) {
            const file = files[index];
            try {
                const blob = await compressImage(file);
                const form = new FormData();
                form.append("file", new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }));

                const res = await fetch(`/api/client-invoices/${invoiceId}/attachments`, { method: "POST", body: form });
                if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Error al subir la imagen");
                uploaded++;
            } catch (error: any) {
                toast.error(`${file.name}: ${error.message}`);
            } finally {
                URL.revokeObjectURL(pending[index].preview);
                setUploads((current) => current.filter((upload) => upload.id !== pending[index].id));
            }
        }

        if (uploaded > 0) {
            toast.success(uploaded === 1 ? "Imagen agregada" : `${uploaded} imágenes agregadas`);
            onChange();
        }
    };

    const confirmDelete = async () => {
        if (!deleting) return;
        setBusy(true);
        const res = await fetch(`/api/attachments/${deleting.id}`, { method: "DELETE" });
        setBusy(false);
        setDeleting(null);
        setViewing(null);

        if (!res.ok) return toast.error("Error al eliminar la imagen");
        toast.success("Imagen eliminada");
        onChange();
    };

    const current = viewing !== null ? attachments[viewing] : null;
    const isEmpty = attachments.length === 0 && uploads.length === 0;

    return (
        <Panel
            title="Evidencias"
            description={attachments.length > 0 ? `${attachments.length} imagen(es)` : "Fotos de la entrega, remisiones o soportes"}
            actions={
                <Button variant="secondary" icon={<HiOutlineCamera className="h-4 w-4" />} onClick={() => input.current?.click()}>
                    Agregar fotos
                </Button>
            }
            flush={isEmpty}
        >
            <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />

            {isEmpty ? (
                <EmptyState
                    icon={<HiOutlineCamera />}
                    title="Sin evidencias"
                    description="Agrega fotos desde la cámara o la galería del iPad."
                    action={<Button variant="secondary" onClick={() => input.current?.click()}>Agregar fotos</Button>}
                />
            ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {attachments.map((attachment, index) => (
                        <li key={attachment.id} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
                            <button
                                type="button"
                                onClick={() => setViewing(index)}
                                aria-label={`Ver ${attachment.name}`}
                                className="block h-full w-full focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={fileUrl(attachment.id)} alt={attachment.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeleting(attachment)}
                                aria-label="Eliminar imagen"
                                className="absolute right-1.5 top-1.5 flex h-10 w-10 items-center justify-center rounded-lg bg-white/90 text-slate-600 shadow-xs backdrop-blur-sm hover:text-red-600"
                            >
                                <HiOutlineTrash className="h-5 w-5" />
                            </button>
                        </li>
                    ))}
                    {uploads.map((upload) => (
                        <li key={upload.id} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={upload.preview} alt="" className="h-full w-full object-cover opacity-40" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm font-medium text-slate-700">
                                <Spinner className="h-6 w-6 text-emerald-600" />
                                Subiendo...
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Lightbox */}
            <Modal isOpen={current !== null} onClose={() => setViewing(null)} placement="center" size="5xl" backdrop="blur">
                <ModalContent>
                    {current && viewing !== null && (
                        <ModalBody className="p-3 sm:p-4">
                            <div className="relative flex items-center justify-center rounded-lg bg-slate-950">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={fileUrl(current.id)} alt={current.name} className="max-h-[75dvh] w-auto object-contain" />
                                {attachments.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setViewing((viewing - 1 + attachments.length) % attachments.length)}
                                            aria-label="Imagen anterior"
                                            className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm"
                                        >
                                            <HiOutlineChevronLeft className="h-5 w-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViewing((viewing + 1) % attachments.length)}
                                            aria-label="Imagen siguiente"
                                            className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm"
                                        >
                                            <HiOutlineChevronRight className="h-5 w-5" />
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center justify-between gap-3 pt-2">
                                <div className="min-w-0 text-sm">
                                    <p className="font-medium text-slate-900 wrap-anywhere">{current.name}</p>
                                    <p className="text-slate-500">{formatDateTime(current.createdAt)} · {viewing + 1} de {attachments.length}</p>
                                </div>
                                <Button variant="danger" icon={<HiOutlineTrash className="h-4 w-4" />} onClick={() => setDeleting(current)}>
                                    Eliminar
                                </Button>
                            </div>
                        </ModalBody>
                    )}
                </ModalContent>
            </Modal>

            <ConfirmDialog
                open={deleting !== null}
                onClose={() => !busy && setDeleting(null)}
                onConfirm={confirmDelete}
                loading={busy}
                title="¿Eliminar esta imagen?"
                description="La imagen se borrará de la factura y del almacenamiento. Esta acción no se puede deshacer."
                confirmLabel="Eliminar imagen"
            />
        </Panel>
    );
}
