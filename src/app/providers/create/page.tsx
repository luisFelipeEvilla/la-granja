"use client";
import PrimaryButton from "@/app/componeents/buttons/PrimaryButton";
import { Card, Select, SelectItem, TextInput, Title, } from "@tremor/react";
import { useState } from "react";
import { FormSubmitHandler, SubmitHandler, useForm } from "react-hook-form";

type Inputs = {
    id: string,
    idType: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string
}
export default function CreateProvider() {
    const { register, handleSubmit, formState: { errors }} = useForm<Inputs>()
    const [idType, setIdType] = useState<string>('');

    const onSubmit: SubmitHandler<Inputs> = (data) => {
        console.log(data);
    }

    return (
        <div className="flex h-full w-full items-center py-14">
            <form onSubmit={handleSubmit(onSubmit)} className="flex items-center w-full flex-col gap-6">
                <Card className="flex flex-col gap-2 w-[600px]">
                    <Title>Información Básica</Title>
                    <TextInput 
                        {...register('firstName', { required: true})}
                        placeholder="Nombres" 
                        error={errors.firstName != undefined}
                        errorMessage={errors.firstName ? "Este campo es requerido" : ''}     
                    />
                    <TextInput 
                        {...register('lastName', { required: true})}  
                        error={errors.lastName != undefined}
                        errorMessage={errors.lastName ? "Este campo es requerido" : ''}
                        placeholder="Apellidos" 
                    />
                    <Select 
                        value={idType}
                        // @ts-ignore
                        onChange={(e) => setIdType(e)}
                        placeholder="Tipo de identificación" 
                    >
                        <SelectItem value="CC">Cédula de ciudadania</SelectItem>
                        <SelectItem value="NIT">NIT</SelectItem>
                    </Select>
                    <TextInput 
                        {...register('id', { required: true})}  
                        error={errors.id != undefined}
                        errorMessage={errors.id ? "Este campo es requerido" : ''}
                        placeholder="Número de identificación" 
                    />

                </Card>

                <Card className="flex flex-col gap-2 w-[600px]">
                    <Title>Información de contacto</Title>
                    <TextInput 
                        {...register('email')}  
                        placeholder="Email" 
                    />
                    <TextInput 
                        {...register('phone', { required: true})} 
                        placeholder="Telefono de contacto" 
                        error={errors.phone != undefined}
                        errorMessage={errors.phone ? "Este campo es requerido" : ''}
                    />
                </Card>
                <PrimaryButton text="Guardar" />
            </form>
        </div>
    )
}