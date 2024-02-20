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
      <div className={`z-50`}>
        <OpenMenuButton isOpen={isOpen} setIsOpen={setIsOpen} />
  
        <div
          onClick={() => setIsOpen(false)}
          className={`absolute top-0 left-0 w-full h-screen bg-black opacity-50
                  ${isOpen ? "ease-in block" : "ease-out hidden"} duration-3000
              `}
        ></div>
  
        <div
          className={`absolute left-0 top-0 w-[250px] bg-slate-900 h-screen py-8 text-gray-100
                  ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                  } duration-1000    
              `}
        >
          <CloseMenuButton setIsOpen={setIsOpen}/>
  
          <div className="flex justify-center">
            <Image
              className="rounded-full object-cover w-auto"
              width={120}
              height={150}
              src={"/images/logo.jpg"}
              alt="logo"
            />
          </div>
          <div className="mt-10">
            <ul>
              {props.links.map((link, index) => (
                <LinkButton key={index} link={link} />
              ))}
  
              <li className="flex items-center px-4 py-2 text-center border-t-[1px] border-slate-400 hover:bg-slate-800">
                <Button
                  color="danger"
                  onPress={signout}
                >
                  Cerrar Sesión
                </Button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
}