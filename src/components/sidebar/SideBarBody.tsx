"use client";

import { AuthContext } from "@/contexts/AuthContext";
import { useState, useContext, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@nextui-org/react";
import CloseMenuButton from "../buttons/CloseMenuButton";
import LinkButton, { Link } from "../buttons/LinkButton";
import OpenMenuButton from "../buttons/OpenMenuButton";
import Image from "next/image";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SideBarBody(props: { links: Link[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const { signout } = useContext(AuthContext);
    const pathname = usePathname();

    const currentLink = props.links.find((link) => isActive(pathname, link.href));

    // Cerrar el menú al cambiar de ruta
    useEffect(() => {
      setIsOpen(false);
    }, [pathname]);

    // Bloquear el scroll del fondo y permitir cerrar con Escape mientras el menú está abierto
    useEffect(() => {
      if (!isOpen) return;

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsOpen(false);
      };
      window.addEventListener("keydown", onKeyDown);

      return () => {
        document.body.style.overflow = previousOverflow;
        window.removeEventListener("keydown", onKeyDown);
      };
    }, [isOpen]);

    return (
      <>
        {/* Mobile / Tablet Top Bar */}
        <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 safe-top box-content bg-slate-900 text-gray-100 shadow-md">
          <div className="h-14 flex items-center gap-3 px-4">
            <OpenMenuButton isOpen={isOpen} setIsOpen={setIsOpen} />
            <Image
              className="rounded-md object-cover h-8 w-auto"
              width={46}
              height={32}
              src="/images/logo.jpg"
              alt="logo"
            />
            <span className="text-base font-semibold truncate">
              {currentLink?.label ?? "La Granja"}
            </span>
          </div>
        </header>

        {/* Mobile Overlay */}
        <div
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
          className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300
                  ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
              `}
        />

        {/* Sidebar */}
        <aside
          id="sidebar"
          className={`
          fixed lg:sticky inset-y-0 lg:top-0 left-0 z-50 lg:z-0
          w-72 max-w-[85vw] lg:w-64 shrink-0 bg-slate-900 text-gray-100
          transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          flex flex-col h-[100dvh] lg:h-screen overflow-y-auto safe-top safe-bottom
        `}>
          {/* Mobile Close Button */}
          <div className="lg:hidden p-4 flex justify-end">
            <CloseMenuButton setIsOpen={setIsOpen}/>
          </div>

          {/* Logo */}
          <div className="flex justify-center px-4 pb-4 lg:p-8">
            <Image
              className="rounded-full object-cover w-auto"
              width={100}
              height={120}
              src="/images/logo.jpg"
              alt="logo"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4">
            <ul className="space-y-2">
              {props.links.map((link, index) => (
                <LinkButton
                  key={index}
                  link={link}
                  active={isActive(pathname, link.href)}
                  onNavigate={() => setIsOpen(false)}
                />
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-slate-700">
            <Button
              color="danger"
              className="w-full"
              onPress={signout}
            >
              Cerrar Sesión
            </Button>
          </div>
        </aside>
      </>
    );
}
