"use client";
import { ClientReceivable, getReminderMessage, getWhatsappUrl, toWhatsappPhone } from "@/app/utils/sales";
import { formatCOP } from "@/app/utils/clientInvoice";
import Button, { ButtonLink } from "@/components/ui/Button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { HiOutlineChatBubbleLeftEllipsis, HiOutlineClipboardDocument, HiOutlineExclamationTriangle } from "react-icons/hi2";
import toast from "react-hot-toast";

type Props = {
    // dialog is open while a receivable is given
    receivable: ClientReceivable | null,
    onClose: () => void,
    onSent: () => void
};

// shows the WhatsApp message for a client's pending balance; sending opens WhatsApp and logs the reminder
export default function ReminderDialog({ receivable, onClose, onSent }: Props) {
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (receivable) setMessage(getReminderMessage(receivable));
    }, [receivable]);

    const phone = toWhatsappPhone(receivable?.client.phone);

    const send = async () => {
        if (!receivable || !phone || !message.trim()) return;

        // opened synchronously inside the tap, otherwise iPad Safari blocks it as a popup
        window.open(getWhatsappUrl(phone, message), "_blank", "noopener");

        setSaving(true);
        try {
            const res = await fetch(`/api/clients/${receivable.client.id}/reminders`, {
                method: "POST",
                body: JSON.stringify({
                    balance: receivable.balance,
                    invoiceNumbers: receivable.pending.map(({ invoice }) => invoice.number),
                    message
                })
            });
            if (!res.ok) throw new Error();

            toast.success("Recordatorio registrado");
            onSent();
            onClose();
        } catch {
            toast.error("Se abrió WhatsApp, pero no se pudo registrar el recordatorio");
        } finally {
            setSaving(false);
        }
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(message);
            toast.success("Mensaje copiado");
        } catch {
            toast.error("No se pudo copiar el mensaje");
        }
    };

    return (
        <Modal isOpen={!!receivable} onClose={onClose} placement="center" backdrop="blur" size="lg" scrollBehavior="inside">
            <ModalContent>
                {receivable && (
                    <>
                        <ModalHeader className="flex flex-col gap-0.5">
                            <span className="text-lg font-semibold text-slate-900">Recordar pago por WhatsApp</span>
                            <span className="text-sm font-normal text-slate-500">
                                {receivable.client.name} · Saldo {formatCOP(receivable.balance)} · {receivable.pending.length} factura(s)
                            </span>
                        </ModalHeader>
                        <ModalBody className="space-y-3">
                            {phone ? (
                                <p className="text-sm text-slate-600">
                                    Se enviará a <span className="font-semibold text-slate-900">+{phone.slice(0, 2)} {phone.slice(2)}</span>
                                </p>
                            ) : (
                                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    <HiOutlineExclamationTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                                    <div className="space-y-2">
                                        <p>El cliente no tiene un celular válido{receivable.client.phone ? ` (${receivable.client.phone})` : ""}.</p>
                                        <ButtonLink href={`/dashboard/clients/${receivable.client.id}/edit`} variant="secondary" size="sm">
                                            Editar cliente
                                        </ButtonLink>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label htmlFor="reminder-message" className="block text-sm font-medium text-slate-700">Mensaje</label>
                                <textarea
                                    id="reminder-message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={9}
                                    className="w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <p className="text-sm text-slate-500">Puedes editarlo antes de enviarlo.</p>
                            </div>
                        </ModalBody>
                        <ModalFooter className="flex-wrap">
                            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
                            <Button variant="secondary" onClick={copy} icon={<HiOutlineClipboardDocument className="h-4 w-4" />}>
                                Copiar mensaje
                            </Button>
                            <Button
                                onClick={send}
                                loading={saving}
                                disabled={!phone || !message.trim()}
                                icon={<HiOutlineChatBubbleLeftEllipsis className="h-4 w-4" />}
                            >
                                Abrir WhatsApp
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
