"use client";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { idTypeLabels } from "@/app/utils/clientInvoice";
import { Client } from "@prisma/client";
import { Select, SelectItem, TextInput, Title } from "@tremor/react";
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
    const backHref = client ? `/dashboard/clients/${client.id}` : '/dashboard/clients';

    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        if (!idType) return toast.error('Selecciona el tipo de identificación');

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                    <Title className="text-lg font-semibold text-gray-900">Información Básica</Title>
                </div>
                <div className="p-4 sm:p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Nombre o razón social *</label>
                        <TextInput
                            {...register('name', { required: true })}
                            placeholder="Nombre o razón social"
                            error={errors.name != undefined}
                            errorMessage={errors.name ? "Este campo es requerido" : ''}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Tipo de identificación *</label>
                            <Select value={idType} onValueChange={setIdType} placeholder="Seleccionar tipo">
                                {Object.entries(idTypeLabels).map(([value, label]) =>
                                    <SelectItem value={value} key={value}>{label}</SelectItem>
                                )}
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Número de identificación *</label>
                            <TextInput
                                {...register('idNum', { required: true })}
                                placeholder="Número de identificación"
                                error={errors.idNum != undefined}
                                errorMessage={errors.idNum ? "Este campo es requerido" : ''}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                    <Title className="text-lg font-semibold text-gray-900">Información de Contacto</Title>
                </div>
                <div className="p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <TextInput {...register('email')} placeholder="correo@ejemplo.com" type="email" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Teléfono</label>
                            <TextInput {...register('phone')} placeholder="Teléfono de contacto" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Dirección</label>
                        <TextInput {...register('address')} placeholder="Dirección" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <a
                    href={backHref}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                >
                    Cancelar
                </a>
                <PrimaryButton text="Guardar Cliente" disabled={isSubmitting} />
            </div>
        </form>
    )
}
