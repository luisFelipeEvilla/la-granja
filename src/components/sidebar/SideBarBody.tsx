"use client";

import { AuthContext } from "@/contexts/AuthContext";
import { useState, useContext } from "react";
import { Button } from "@nextui-org/react";
import CloseMenuButton from "../buttons/CloseMenuButton";
import LinkButton, { Link } from "../buttons/LinkButton";
import OpenMenuButton from "../buttons/OpenMenuButton";
import Image from "next/image";

export default function SideBarBody(props: { links: Link[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const { signout } = useContext(AuthContext);
  
    return (
      <>
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <OpenMenuButton isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>

        {/* Mobile Overlay */}
        <div
          onClick={() => setIsOpen(false)}
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden
                  ${isOpen ? "block" : "hidden"} transition-opacity duration-300
              `}
        />

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-0
          w-56 sm:w-64 bg-slate-900 text-gray-100
          transform ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          flex flex-col h-full lg:h-screen
        `}>
          {/* Mobile Close Button */}
          <div className="lg:hidden p-4 flex justify-end">
            <CloseMenuButton setIsOpen={setIsOpen}/>
          </div>

          {/* Logo */}
          <div className="flex justify-center p-4 lg:p-8">
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
                <LinkButton key={index} link={link} />
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