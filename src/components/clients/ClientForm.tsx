"use client";
import Button, { ButtonLink } from "@/components/ui/Button";
import Field, { FormSection } from "@/components/ui/Field";
import Panel from "@/components/ui/Panel";
import { idTypeLabels } from "@/app/utils/clientInvoice";
import { Client } from "@prisma/client";
import { Select, SelectItem, TextInput } from "@tremor/react";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";

type Inputs = Pick<Client, 'name' | 'idNum'> & {
    phone: string,
    email: string,
    address: string
};

type Props = { client?: Client };

export default function ClientForm({ client }: Props) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Inputs>({
        defaultValues: {
            name: client?.name ?? '',
            idNum: client?.idNum ?? '',
            phone: client?.phone ?? '',
            email: client?.email ?? '',
            address: client?.address ?? ''
        }
    });
    const [idType, setIdType] = useState<string>(client?.idType ?? '');
    const [idTypeError, setIdTypeError] = useState(false);
    const backHref = client ? `/dashboard/clients/${client.id}` : '/dashboard/clients';

    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        if (!idType) {
            setIdTypeError(true);
            return toast.error('Selecciona el tipo de identificación');
        }

        const res = await fetch(client ? `/api/clients/${client.id}` : '/api/clients', {
            method: client ? 'PATCH' : 'POST',
            body: JSON.stringify({ ...data, idType })
        });
        const json = await res.json();

        if (!res.ok) return toast.error(json.message ?? 'Error al guardar el cliente');

        toast.success('Cliente guardado correctamente');
        window.location.href = `/dashboard/clients/${json.id}`;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Panel
                footer={
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <ButtonLink href={backHref} variant="secondary">Cancelar</ButtonLink>
                        <Button type="submit" loading={isSubmitting}>
                            {client ? 'Guardar cambios' : 'Crear cliente'}
                        </Button>
                    </div>
                }
            >
                <div className="divide-y divide-slate-100">
                    <FormSection title="Datos del cliente" description="Nombre e identificación con los que se emiten las facturas.">
                        <Field label="Nombre o razón social" htmlFor="name" required error={errors.name && 'Ingresa el nombre del cliente'}>
                            <TextInput
                                id="name"
                                {...register('name', { required: true })}
                                placeholder="Ej: Distribuidora El Prado"
                                error={errors.name != undefined}
                                autoComplete="organization"
                            />
                        </Field>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Tipo de identificación" required error={idTypeError && !idType && 'Selecciona un tipo'}>
                                <Select
                                    value={idType}
                                    onValueChange={(value) => { setIdType(value); setIdTypeError(false); }}
                                    placeholder="Seleccionar tipo"
                                    enableClear={false}
                                    error={idTypeError && !idType}
                                >
                                    {Object.entries(idTypeLabels).map(([value, label]) =>
                                        <SelectItem value={value} key={value}>{label}</SelectItem>
                                    )}
                                </Select>
                            </Field>
                            <Field label="Número de identificación" htmlFor="idNum" required error={errors.idNum && 'Ingresa el número'} hint="Para NIT incluye el dígito de verificación">
                                <TextInput
                                    id="idNum"
                                    {...register('idNum', { required: true })}
                                    placeholder="900123456-7"
                                    error={errors.idNum != undefined}
                                />
                            </Field>
                        </div>
                    </FormSection>

                    <FormSection title="Contacto" description="Opcional. Se muestra en la ficha y en los documentos.">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Teléfono" htmlFor="phone">
                                <TextInput id="phone" {...register('phone')} placeholder="300 123 4567" inputMode="tel" autoComplete="tel" />
                            </Field>
                            <Field label="Correo electrónico" htmlFor="email">
                                <TextInput id="email" {...register('email')} placeholder="correo@ejemplo.com" type="email" autoComplete="email" />
                            </Field>
                        </div>
                        <Field label="Dirección" htmlFor="address">
                            <TextInput id="address" {...register('address')} placeholder="Calle, número, ciudad" autoComplete="street-address" />
                        </Field>
                    </FormSection>
                </div>
            </Panel>
        </form>
    )
}
