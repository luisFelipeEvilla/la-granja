import { User } from "@prisma/client";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export default function getUserFromCookies(cookieStore: ReadonlyRequestCookies): User | null {
  const userCookie = cookieStore.get("user");
  if (!userCookie) return null;

  const user = cookieStore.get("user") ? JSON.parse(userCookie.value) : null;
  return user;
}
