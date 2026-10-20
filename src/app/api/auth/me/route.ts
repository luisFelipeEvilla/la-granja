import { getSession } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    return NextResponse.json({ user: { username: session.username, role: session.role } });
}
