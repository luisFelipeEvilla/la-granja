"use client";
import { AuthProvider } from "@/contexts/AuthContext";
import { NextUIProvider } from "@nextui-org/react";
import { Toaster } from "react-hot-toast";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-[100dvh] bg-slate-50">
      <NextUIProvider>
        <AuthProvider>{children}</AuthProvider>
      </NextUIProvider>
      <Toaster position="top-center" />
    </div>
  );
}
