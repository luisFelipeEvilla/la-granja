"use client";

import { AuthContext } from "@/contexts/AuthContext";
import { useState, useContext, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@nextui-org/react";
import CloseMenuButton from "../buttons/CloseMenuButton";
import LinkButton, { Link } from "../buttons/LinkButton";
import OpenMenuButton from "../buttons/OpenMenuButton";
import Image from "next/image";

export default function SideBarBody(props: { links: Link[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const { signout } = useContext(AuthContext);
    const pathname = usePathname();

    // Most specific link that matches the current route
    const activeHref = props.links
      .map((link) => link.href)
      .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
      .sort((a, b) => b.length - a.length)[0];

    const currentLabel = props.links.find((link) => link.href === activeHref)?.label;

    useEffect(() => {
      setIsOpen(false);
    }, [pathname]);

    // Lock background scroll and allow closing with Escape while the drawer is open
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
        {/* Mobile / tablet top bar */}
        <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center gap-3 px-2 sm:px-4 bg-slate-900 text-gray-100 shadow-md">
          <OpenMenuButton isOpen={isOpen} setIsOpen={setIsOpen} />
          <Image
            className="rounded-full object-cover h-9 w-9"
            width={36}
            height={36}
            src="/images/logo.jpg"
            alt="logo"
          />
          <span className="text-base font-semibold truncate">
            {currentLabel ?? "La Granja"}
          </span>
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
          className={`
          fixed lg:sticky inset-y-0 lg:top-0 left-0 z-50 lg:z-0
          w-72 max-w-[85vw] lg:w-64 bg-slate-900 text-gray-100
          transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          flex flex-col h-[100dvh] lg:h-screen flex-shrink-0
        `}
          aria-label="Menú principal"
        >
          {/* Mobile Close Button */}
          <div className="lg:hidden p-2 flex justify-end">
            <CloseMenuButton setIsOpen={setIsOpen}/>
          </div>

          {/* Logo */}
          <div className="flex justify-center px-4 pb-4 lg:p-8">
            <Image
              className="rounded-full object-cover w-20 h-20 lg:w-24 lg:h-24"
              width={100}
              height={100}
              src="/images/logo.jpg"
              alt="logo"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 overflow-y-auto">
            <ul className="space-y-1">
              {props.links.map((link, index) => (
                <LinkButton key={index} link={link} active={link.href === activeHref} />
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-slate-700 safe-bottom">
            <Button
              color="danger"
              className="w-full"
              size="lg"
              onPress={signout}
            >
              Cerrar Sesión
            </Button>
          </div>
        </aside>
      </>
    );
}
