"use client";

import { AuthContext } from "@/contexts/AuthContext";
import { useState, useContext, useEffect } from "react";
import { usePathname } from "next/navigation";
import { BiLogOut } from "react-icons/bi";
import CloseMenuButton from "../buttons/CloseMenuButton";
import LinkButton, { Link } from "../buttons/LinkButton";
import OpenMenuButton from "../buttons/OpenMenuButton";
import Image from "next/image";

const isActive = (pathname: string, href: string) =>
  href === "/dashboard" ? pathname === href : pathname.startsWith(href);

export default function SideBarBody(props: { links: Link[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const { signout } = useContext(AuthContext);
    const pathname = usePathname();

    // close the drawer after navigating
    useEffect(() => setIsOpen(false), [pathname]);

    const currentLink = props.links.find((link) => isActive(pathname, link.href));

    return (
      <>
        {/* Phone top bar */}
        <header className="md:hidden sticky top-0 z-30 bg-slate-900 text-gray-100 safe-top">
          <div className="flex items-center gap-3 h-14 px-3">
            <OpenMenuButton isOpen={isOpen} setIsOpen={setIsOpen} />
            <span className="font-semibold truncate">{currentLink?.label ?? "La Granja"}</span>
          </div>
        </header>

        {/* Phone overlay */}
        <div
          onClick={() => setIsOpen(false)}
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden
                  ${isOpen ? "block" : "hidden"} transition-opacity duration-300
              `}
        />

        {/* Drawer on phones, icon rail on iPad portrait, full sidebar on iPad landscape and desktop */}
        <aside className={`
          fixed md:sticky top-0 inset-y-0 left-0 z-50 md:z-0
          w-64 md:w-24 lg:w-64 flex-shrink-0 bg-slate-900 text-gray-100
          transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 transition-transform duration-300 ease-in-out
          flex flex-col h-[100dvh] overflow-y-auto overscroll-contain safe-top safe-bottom
        `}>
          {/* Phone close button */}
          <div className="md:hidden p-4 flex justify-end">
            <CloseMenuButton setIsOpen={setIsOpen}/>
          </div>

          {/* Logo */}
          <div className="flex justify-center p-4 md:p-3 lg:p-8">
            <Image
              className="rounded-full object-cover w-auto md:w-16 lg:w-auto"
              width={100}
              height={120}
              src="/images/logo.jpg"
              alt="logo"
              priority
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 md:px-2 lg:px-4">
            <ul className="space-y-2">
              {props.links.map((link) => (
                <LinkButton
                  key={link.href}
                  link={link}
                  active={isActive(pathname, link.href)}
                  onNavigate={() => setIsOpen(false)}
                />
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 md:p-2 lg:p-4 border-t border-slate-700">
            <button
              type="button"
              onClick={signout}
              aria-label="Cerrar Sesión"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-danger text-white font-medium
                         px-4 py-3 md:flex-col md:gap-1 md:px-1 md:py-2 md:text-[11px] lg:flex-row lg:gap-2 lg:px-4 lg:py-3 lg:text-sm
                         hover:opacity-90 active:opacity-80 transition-opacity"
            >
              <BiLogOut className="text-xl hidden md:block lg:hidden" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>
      </>
    );
}
