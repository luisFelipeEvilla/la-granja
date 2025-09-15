"use client";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { Card, Select, SelectItem, TextInput, Title, } from "@tremor/react";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

type Inputs = {
    idNum: string | number,
    idType: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string | number
}
export default function CreateProvider() {
    const { register, handleSubmit, formState: { errors }} = useForm<Inputs>()
    const [idType, setIdType] = useState<string>('');

    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        const body = {
            ...data,
            idType: idType
        };

        body.idNum = parseInt(body.idNum as string);
        body.phone = parseInt(body.phone as string);

        const res = await fetch('/api/providers', {
            method: 'POST',
            body: JSON.stringify(body),
        });

        const json = await res.json();

        window.location.href = '/providers';
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <Title className="text-2xl sm:text-3xl font-bold text-gray-900">Crear Nuevo Proveedor</Title>
                    <a
                        href="/dashboard/providers"
                        className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 text-center"
                    >
                        Volver a la lista
                    </a>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Información Básica */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                        <Title className="text-lg font-semibold text-gray-900">Información Básica</Title>
                    </div>
                    <div className="p-4 sm:p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Nombres *</label>
                                <TextInput 
                                    {...register('firstName', { required: true})}
                                    placeholder="Nombres" 
                                    error={errors.firstName != undefined}
                                    errorMessage={errors.firstName ? "Este campo es requerido" : ''}     
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Apellidos *</label>
                                <TextInput 
                                    {...register('lastName', { required: true})}  
                                    error={errors.lastName != undefined}
                                    errorMessage={errors.lastName ? "Este campo es requerido" : ''}
                                    placeholder="Apellidos" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Tipo de identificación *</label>
                                <Select 
                                    value={idType}
                                    // @ts-ignore
                                    onChange={(e) => setIdType(e)}
                                    placeholder="Seleccionar tipo" 
                                >
                                    <SelectItem value="CC">Cédula de ciudadanía</SelectItem>
                                    <SelectItem value="NIT">NIT</SelectItem>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Número de identificación *</label>
                                <TextInput 
                                    {...register('idNum', { required: true})}  
                                    error={errors.idNum != undefined}
                                    errorMessage={errors.idNum ? "Este campo es requerido" : ''}
                                    placeholder="Número de identificación"
                                    type="number"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Información de contacto */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                        <Title className="text-lg font-semibold text-gray-900">Información de Contacto</Title>
                    </div>
                    <div className="p-4 sm:p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <TextInput 
                                    {...register('email')}  
                                    placeholder="correo@ejemplo.com"
                                    type="email"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Teléfono de contacto *</label>
                                <TextInput 
                                    {...register('phone', { required: true})} 
                                    placeholder="Teléfono de contacto" 
                                    error={errors.phone != undefined}
                                    errorMessage={errors.phone ? "Este campo es requerido" : ''}
                                    type="tel"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                    <a
                        href="/dashboard/providers"
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                    >
                        Cancelar
                    </a>
                    <PrimaryButton text="Guardar Proveedor" />
                </div>
            </form>
        </div>
    )
}