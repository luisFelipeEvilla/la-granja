"use client";

import { AuthContext } from "@/contexts/AuthContext";
import { useState, useContext, useEffect } from "react";
import { usePathname } from "next/navigation";
import { HiOutlineArrowRightOnRectangle, HiOutlineBars3, HiOutlineChevronDoubleLeft } from "react-icons/hi2";
import CloseMenuButton from "../buttons/CloseMenuButton";
import LinkButton, { Link } from "../buttons/LinkButton";
import OpenMenuButton from "../buttons/OpenMenuButton";
import Image from "next/image";

export type NavSection = { title: string, links: Link[] };

type Props = { sections: NavSection[], user: { name: string, role: string } };

const HIDDEN_KEY = "sidebar-hidden";

const isActive = (pathname: string, href: string) =>
  href === "/dashboard" ? pathname === href : pathname.startsWith(href);

export default function SideBarBody({ sections, user }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    // iPad / desktop: the user can hide the sidebar to give the page the full width
    const [hidden, setHidden] = useState(false);
    const { signout } = useContext(AuthContext);
    const pathname = usePathname();

    // close the drawer after navigating
    useEffect(() => setIsOpen(false), [pathname]);

    // remembered per device; storage can be unavailable (private mode), so it is optional
    useEffect(() => {
      try { setHidden(localStorage.getItem(HIDDEN_KEY) === "1"); } catch {}
    }, []);

    const toggleHidden = () => setHidden((value) => {
      try { localStorage.setItem(HIDDEN_KEY, value ? "0" : "1"); } catch {}
      return !value;
    });

    // ⌘B / Ctrl+B toggles the sidebar (iPad with keyboard, desktop)
    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
          e.preventDefault();
          toggleHidden();
        }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const currentLink = sections.flatMap((section) => section.links).find((link) => isActive(pathname, link.href));
    const initials = user.name.slice(0, 2).toUpperCase() || "LG";

    return (
      <>
        {/* Phone top bar */}
        <header className="md:hidden sticky top-0 z-30 bg-slate-950/95 backdrop-blur text-white safe-top">
          <div className="flex items-center gap-2 h-14 px-2">
            <OpenMenuButton isOpen={isOpen} setIsOpen={setIsOpen} />
            <span className="font-semibold truncate">{currentLink?.label ?? "La Granja"}</span>
          </div>
        </header>

        {/* Phone overlay */}
        <div
          onClick={() => setIsOpen(false)}
          className={`fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300
                  ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        />

        {/* Hidden sidebar (iPad / desktop): a slim strip with the button to bring it back */}
        {hidden && (
          <div className="hidden md:flex sticky top-0 h-[100dvh] w-14 shrink-0 flex-col items-center pt-safe">
            <button
              type="button"
              onClick={toggleHidden}
              aria-label="Mostrar menú"
              title="Mostrar menú (⌘B)"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-slate-900 hover:bg-slate-50"
            >
              <HiOutlineBars3 className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Drawer on phones, icon rail on iPad portrait, full sidebar on iPad landscape and desktop */}
        <aside className={`${hidden ? "md:hidden" : ""}
          fixed md:sticky top-0 inset-y-0 left-0 z-50 md:z-0
          w-72 md:w-[88px] lg:w-64 flex-shrink-0 bg-slate-950 text-slate-300
          transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 transition-transform duration-300 ease-out
          flex flex-col h-[100dvh] overflow-y-auto overscroll-contain scrollbar-hide safe-top safe-bottom
        `}>
          {/* Brand */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-6 md:flex-col md:px-2 md:pt-5 md:pb-4 lg:flex-row lg:px-5 lg:pt-6 lg:pb-6">
            <Image
              className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10"
              width={80}
              height={80}
              src="/images/logo.jpg"
              alt=""
              priority
            />
            <div className="min-w-0 md:hidden lg:block">
              <p className="text-sm font-semibold text-white leading-tight">La Granja</p>
              <p className="text-xs text-slate-500">Lácteos</p>
            </div>
            <div className="ml-auto md:hidden">
              <CloseMenuButton setIsOpen={setIsOpen}/>
            </div>
            <button
              type="button"
              onClick={toggleHidden}
              aria-label="Ocultar menú"
              title="Ocultar menú (⌘B)"
              className="hidden md:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-white lg:ml-auto"
            >
              <HiOutlineChevronDoubleLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-6 px-3 md:px-2 lg:px-3" aria-label="Navegación principal">
            {sections.map((section) => (
              <div key={section.title}>
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:hidden lg:block">
                  {section.title}
                </p>
                <div className="mx-auto mb-2 hidden h-px w-8 bg-white/10 md:block lg:hidden" />
                <ul className="space-y-1">
                  {section.links.map((link) => (
                    <LinkButton
                      key={link.href}
                      link={link}
                      active={isActive(pathname, link.href)}
                      onNavigate={() => setIsOpen(false)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* User */}
          <div className="m-3 flex items-center gap-3 rounded-xl bg-white/5 p-2.5 md:m-2 md:flex-col md:gap-2 md:p-2 lg:m-3 lg:flex-row lg:gap-3 lg:p-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-xs font-bold text-emerald-300">
              {initials}
            </span>
            <div className="min-w-0 flex-1 md:hidden lg:block">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.role}</p>
            </div>
            <button
              type="button"
              onClick={signout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <HiOutlineArrowRightOnRectangle className="h-5 w-5" />
            </button>
          </div>
        </aside>
      </>
    );
}
