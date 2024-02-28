import prisma from "@/db/client";
import { NextResponse } from "next/server";

export async function GET(req: any) {
  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");
  const active = req.nextUrl.searchParams.get("active");

  const today = new Date();
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 1);

  try {
    const providers = await prisma.provider.findMany({
      where: {
        active: active ? active === "true" : undefined,
      },
      include: {
        products: {
          where: {
            createdAt: {
              gte: startDate ? new Date(startDate) : minDate,
              lte: endDate ? new Date(endDate) : today,
            },
          },
        },
      },
      orderBy: [
        {
          firstName: "asc",
        },
        {
          lastName: "asc",
        },
      ],
    });

    return NextResponse.json(providers);
  } catch (error: any) {
    console.error(error.message);
    return new Response(error.message, { status: 500 });
  }
}

export async function POST(req: any, res: any) {
  const { ...provider } = await req.json();

  try {
    const newProvider = await prisma.provider.create({
      data: { ...provider },
    });

    return NextResponse.json(newProvider);
  } catch (error: any) {
    console.error(error.message);
    return new Response(error.message, { status: 500 });
  }
}
