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
    <div className="w-full min-h-[100dvh] bg-gray-50 sm:bg-white safe-top safe-bottom">
      <NextUIProvider>
        <AuthProvider>{children}</AuthProvider>
      </NextUIProvider>
      <Toaster position="top-center" />
    </div>
  );
}
