"use client";
import { Provider } from "@prisma/client";
import { Select, SelectItem, TextInput } from "@/components/ui/form";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { idTypeLabels } from "@/app/utils/clientInvoice";
import Button, { ButtonLink } from "@/components/ui/Button";
import Field, { FormSection } from "@/components/ui/Field";
import Panel from "@/components/ui/Panel";

type Inputs = {
    firstName: string,
    lastName: string,
    idNum: string,
    email: string,
    phone: string
};

// creates a provider, or edits one when `provider` is given
export default function ProviderForm({ provider }: { provider?: Provider }) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Inputs>({
        defaultValues: {
            firstName: provider?.firstName ?? '',
            lastName: provider?.lastName ?? '',
            idNum: provider?.idNum?.toString() ?? '',
            email: provider?.email ?? '',
            phone: provider?.phone?.toString() ?? ''
        }
    });
    const [idType, setIdType] = useState<string>(provider?.idType ?? '');
    const [idTypeError, setIdTypeError] = useState(false);

    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        if (!idType) {
            setIdTypeError(true);
            return toast.error('Selecciona el tipo de identificación');
        }

        const body = {
            ...data,
            idType,
            idNum: parseInt(data.idNum),
            phone: parseInt(data.phone)
        };

        const res = await fetch(provider ? `/api/providers/${provider.id}` : '/api/providers', {
            method: provider ? 'PATCH' : 'POST',
            body: JSON.stringify(body),
        });

        if (!res.ok) return toast.error('No se pudo guardar el proveedor');

        toast.success(provider ? 'Proveedor actualizado' : 'Proveedor creado');
        window.location.href = '/dashboard/providers';
    }

    const required = { required: 'Este campo es requerido' };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Panel>
                <div className="divide-y divide-slate-100">
                    <FormSection title="Datos personales" description="Nombre y documento del productor.">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Nombres" htmlFor="firstName" required error={errors.firstName?.message}>
                                <TextInput id="firstName" {...register('firstName', required)} placeholder="Ej: Juan Carlos" error={!!errors.firstName} autoComplete="given-name" />
                            </Field>
                            <Field label="Apellidos" htmlFor="lastName" required error={errors.lastName?.message}>
                                <TextInput id="lastName" {...register('lastName', required)} placeholder="Ej: Gómez" error={!!errors.lastName} autoComplete="family-name" />
                            </Field>
                        </div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Tipo de identificación" required error={idTypeError ? 'Selecciona un tipo' : undefined}>
                                <Select
                                    value={idType}
                                    onValueChange={(value) => { setIdType(value); setIdTypeError(false); }}
                                    placeholder="Seleccionar tipo"
                                    enableClear={false}
                                    error={idTypeError}
                                >
                                    {Object.entries(idTypeLabels).map(([value, label]) =>
                                        <SelectItem value={value} key={value}>{label}</SelectItem>
                                    )}
                                </Select>
                            </Field>
                            <Field label="Número de identificación" htmlFor="idNum" required error={errors.idNum?.message}>
                                <TextInput
                                    id="idNum"
                                    {...register('idNum', { ...required, pattern: { value: /^\d+$/, message: 'Solo números, sin puntos ni guiones' } })}
                                    placeholder="Ej: 1045678901"
                                    inputMode="numeric"
                                    error={!!errors.idNum}
                                />
                            </Field>
                        </div>
                    </FormSection>

                    <FormSection title="Contacto" description="Para comunicarte con el proveedor.">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Teléfono" htmlFor="phone" required error={errors.phone?.message}>
                                <TextInput
                                    id="phone"
                                    {...register('phone', { ...required, pattern: { value: /^\d+$/, message: 'Solo números' } })}
                                    placeholder="Ej: 3001234567"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    error={!!errors.phone}
                                />
                            </Field>
                            <Field label="Correo electrónico" htmlFor="email" hint="Opcional">
                                <TextInput id="email" {...register('email')} placeholder="correo@ejemplo.com" type="email" autoComplete="email" />
                            </Field>
                        </div>
                    </FormSection>
                </div>
            </Panel>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <ButtonLink href="/dashboard/providers" variant="secondary" size="lg">Cancelar</ButtonLink>
                <Button type="submit" size="lg" loading={isSubmitting}>
                    {provider ? 'Guardar cambios' : 'Crear proveedor'}
                </Button>
            </div>
        </form>
    )
}
