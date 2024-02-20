"use client";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { Provider } from "@prisma/client";
import { Card, Select, SelectItem, TextInput, Title, } from "@tremor/react";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

type Inputs = {
    idNum: string | number,
    idType: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string | number
}
export default function CreateProvider({ params }: any) {
    const { register, handleSubmit, formState: { errors } } = useForm<Inputs>()
    const [idType, setIdType] = useState<string>('');
    const [provider, setProvider] = useState<Provider>()
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/providers/${params.id}`).then(async (res) => {
            const provider = await res.json();
            setProvider(provider);
            setLoading(false);
        })
    }, [])

    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        const body = {
            ...data,
            idType: idType || provider?.idType
        };

        body.idNum = parseInt(body.idNum as string);
        body.phone = parseInt(body.phone as string);

        const res = await fetch(`/api/providers/${params.id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });

        const json = await res.json();
        
        toast.success('Proveedor actualizado correctamente');
        window.location.href = '/providers';
    }

    return (
        <div className="flex h-full w-full items-center py-14">
            {
                loading ? 
                    <p>Cargando...</p>
                    :
                    <form onSubmit={handleSubmit(onSubmit)} className="grid col-span-1 justify-center gap-6 w-full">
                        <Card className="grid col-span-1 gap-2 w-[600px]">
                            <Title>Información Básica</Title>
                            <TextInput
                                {...register('firstName', { required: true })}
                                placeholder="Nombres"
                                error={errors.firstName != undefined}
                                errorMessage={errors.firstName ? "Este campo es requerido" : ''}
                                defaultValue={provider?.firstName}
                            />
                            <TextInput
                                {...register('lastName', { required: true })}
                                error={errors.lastName != undefined}
                                errorMessage={errors.lastName ? "Este campo es requerido" : ''}
                                placeholder="Apellidos"
                                defaultValue={provider?.lastName}
                            />
                            <Select
                                value={idType}
                                // @ts-ignore
                                onChange={(e) => setIdType(e)}
                                placeholder="Tipo de identificación"
                                defaultValue={provider?.idType}
                            >
                                <SelectItem value="CC">Cédula de ciudadania</SelectItem>
                                <SelectItem value="NIT">NIT</SelectItem>
                            </Select>
                            <TextInput
                                {...register('idNum', { required: true })}
                                error={errors.idNum != undefined}
                                errorMessage={errors.idNum ? "Este campo es requerido" : ''}
                                placeholder="Número de identificación"
                                defaultValue={provider?.idNum.toString()}
                            />

                        </Card>

                        <Card className="flex flex-col gap-2 w-[600px]">
                            <Title>Información de contacto</Title>
                            <TextInput
                                {...register('email')}
                                placeholder="Email"
                                defaultValue={provider?.email}
                            />
                            <TextInput
                                {...register('phone', { required: true })}
                                placeholder="Telefono de contacto"
                                error={errors.phone != undefined}
                                errorMessage={errors.phone ? "Este campo es requerido" : ''}
                                defaultValue={provider?.phone.toString()}
                            />
                        </Card>
                        <PrimaryButton text="Guardar" />
                    </form>
            }
        </div>

    )
}