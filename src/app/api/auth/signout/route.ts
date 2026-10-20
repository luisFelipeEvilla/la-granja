import { SESSION_COOKIE } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete("user");
    return response;
}
