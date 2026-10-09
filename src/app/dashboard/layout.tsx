import { Toaster } from "react-hot-toast";
import SideBar from "@/components/sidebar/sideBar";
import { AuthProvider } from "@/contexts/AuthContext";
import { NextUIProvider } from "@nextui-org/react";
import "../globals.css";
import Providers from "@/app/providers";
import getUserFromCookies from "../utils/getUserFromCookies";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          {/* Providers envuelve todo el layout: NextUIProvider agrega un <div> propio
              que, si queda dentro del contenedor flex, impide que <main> se encoja */}
          <Providers>
            <div className="flex min-h-screen">
              <SideBar />
              {/* pt-20 deja espacio para la barra superior fija en móvil/tablet */}
              <main className="flex-1 min-w-0 w-full px-4 sm:px-6 lg:px-8 pt-20 pb-8 lg:py-6">
                {children}
              </main>
            </div>
          </Providers>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
