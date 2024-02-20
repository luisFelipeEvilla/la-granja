import prisma from "@/db/client";
import { setCookie } from "cookies-next";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
  const { username, password } = await req.json();

  // console.log(username)
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (!user)
    return NextResponse.json(
      {
        error: "User doesn't exists",
      },
      {
        status: 404,
      }
    );

  if (user.password !== password)
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    
    const response = NextResponse.json({ user }, { status: 200 });

    response.cookies.set("user", JSON.stringify(user), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    
    return response;
}
