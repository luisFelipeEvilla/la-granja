import prisma from "@/db/client";
import { unit } from "@prisma/client";
import { HttpError } from "./client";

const UNITS = Object.values(unit);

export function parseProduct(body: any) {
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 120) throw new HttpError(400, 'Nombre y unidad son requeridos');
    if (!UNITS.includes(body?.unit)) throw new HttpError(400, 'Unidad inválida');
    return { name, unit: body.unit as unit };
}

export const getProducts = () => prisma.product.findMany({ orderBy: { name: 'asc' } });

export const createProduct = (product: ReturnType<typeof parseProduct>) => prisma.product.create({ data: product });

export const updateProduct = (id: string, product: ReturnType<typeof parseProduct>) =>
    prisma.product.update({ where: { id }, data: product });
