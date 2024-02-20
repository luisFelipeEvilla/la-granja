import { Toaster } from "react-hot-toast";
import SideBar from "@/components/sidebar/sideBar";
import { AuthProvider } from "@/contexts/AuthContext";
import { NextUIProvider } from "@nextui-org/react";
import "../globals.css";
import Providers from "@/app/providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex">
        <AuthProvider>
          <SideBar />
          <Providers>
            <div className="w-[100vw] px-8 h-screen overflow-y-scroll">
              {children}
            </div>
          </Providers>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
