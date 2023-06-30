"use client";
import PrimaryButton from "@/app/componeents/buttons/PrimaryButton";
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
        <div className="flex h-full w-full items-center py-14">
            <form onSubmit={handleSubmit(onSubmit)} className="grid col-span-1 justify-center gap-6 w-full ">
                <Card className="grid col-span-1 gap-2 w-[600px]">
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
                        {...register('idNum', { required: true})}  
                        error={errors.idNum != undefined}
                        errorMessage={errors.idNum ? "Este campo es requerido" : ''}
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