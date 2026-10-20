import prisma from "@/db/client";
import { MilkRouteLog, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { ...params }: any) {
    const dateString = req.nextUrl.searchParams.get('date');

    if (!dateString) return NextResponse.json({ status: 400, message: 'Date not provided' });

    const date = new Date(dateString);
    const afterDate = new Date(dateString);
    afterDate.setDate(afterDate.getDate() + 1);

    try {
        const products = await prisma.milkRouteLog.findMany({
            where: {
                createdAt: {
                    gte: date,
                    lt: afterDate
                }
            }
        });

        return NextResponse.json(products);
    } catch (error) {
        console.log(error);
        return NextResponse.json({ status: 500, message: 'Server error' });
    }
}

const MAX_SAVE_ATTEMPTS = 3;

// Prisma errors caused by a concurrent save of the same sheet:
// P2002 = unique constraint violation, P2034 = transaction write conflict
const isConcurrencyError = (error: any) =>
    error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(error.code);

export async function POST(req: NextRequest) {
    const sheet = await req.json();

    const date = new Date(sheet.date);
    if (isNaN(date.getTime()) || !Array.isArray(sheet.products)) {
        return NextResponse.json({ message: 'Invalid sheet' }, { status: 400 });
    }
    // one sheet per day: normalize to UTC midnight
    date.setUTCHours(0, 0, 0, 0);

    const products: Pick<MilkRouteLog, 'providerId' | 'quantity'>[] = sheet.products;
    // every line must reference a provider id and carry a whole, reasonable amount of liters
    const valid = products.length <= 2000 && products.every((product) =>
        typeof product?.providerId === 'string' && /^[a-f0-9]{24}$/.test(product.providerId) &&
        Number.isInteger(product.quantity) && product.quantity >= 0 && product.quantity <= 100_000
    );
    if (!valid) return NextResponse.json({ message: 'Invalid sheet' }, { status: 400 });
    const providerIds = products.map((product) => product.providerId);

    for (let attempt = 1; attempt <= MAX_SAVE_ATTEMPTS; attempt++) {
        try {
            // upsert per provider inside a transaction so concurrent saves never create duplicates
            const savedProducts = await prisma.$transaction([
                prisma.milkRouteLog.deleteMany({
                    where: { createdAt: date, providerId: { notIn: providerIds } }
                }),
                ...products.map((product) => prisma.milkRouteLog.upsert({
                    where: { providerId_createdAt: { providerId: product.providerId, createdAt: date } },
                    update: { quantity: product.quantity },
                    create: { providerId: product.providerId, quantity: product.quantity, createdAt: date }
                }))
            ]);

            return NextResponse.json({ count: savedProducts.length - 1 });
        } catch (error) {
            if (isConcurrencyError(error) && attempt < MAX_SAVE_ATTEMPTS) continue;

            console.log(error);
            return NextResponse.json({ message: 'Server error' }, { status: 500 });
        }
    }
}
