"use client";
import { AuthProvider } from "@/contexts/AuthContext";
import { NextUIProvider } from "@nextui-org/react";
import { Toaster } from "react-hot-toast";
import "../globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="w-full min-h-screen bg-gray-50 sm:bg-white">
        <NextUIProvider>
          <AuthProvider>{children}</AuthProvider>
        </NextUIProvider>
        <Toaster />
      </body>
    </html>
  );
}
