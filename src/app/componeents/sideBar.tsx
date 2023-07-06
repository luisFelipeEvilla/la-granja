"use client";
import { MdAddBusiness } from "react-icons/md";
import { BiSpreadsheet, BiHome } from "react-icons/bi";
import Image from 'next/image'
import { useState } from "react";
import { LiaFileInvoiceDollarSolid} from "react-icons/lia";

type Link = {
    label: string;
    href: string;
    icon: any;
}

export default function SideBar() {
    const [isOpen, setIsOpen] = useState(false);

    const links = [
        { label: 'Inicio', href: '/', icon: BiHome },
        { label: 'Provedores', href: '/providers', icon: MdAddBusiness },
        { label: 'Planillas', href: '/sheets', icon: BiSpreadsheet },
        { label: 'Facturación', href: '/invoices', icon: LiaFileInvoiceDollarSolid }
    ]

    const OpenMenuButton = () => {
        return isOpen ? '' :
            <button onClick={() => setIsOpen(true)}>
                <svg className="w-11 h-11 top-2 left-2 absolute " fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>
    }

    const CloseMenuButton = () => (
        <button
            onClick={() => setIsOpen(false)}
            className="text-white text-2xl absolute right-4 top-0"
        >
            x
        </button>
    )

    const LinkButton = (props: { link: Link}) => (
        <li className="flex items-center px-4 py-2 text-center border-t-[1px] border-slate-400 hover:bg-slate-800">
            <a href={props.link.href}
                className="flex">
                {<props.link.icon className="fill-gray-100 text-2xl" />}
                <p className="ml-2">{props.link.label}</p>
            </a>
        </li>
    )

    return (
        <div className={`z-50`}>

            <OpenMenuButton />

            <div 
                onClick={() => setIsOpen(false)}
                className={`absolute top-0 left-0 w-full h-screen bg-black opacity-50
                ${isOpen ? 'ease-in block' : 'ease-out hidden'} duration-3000
            `}></div>

            <div className={`absolute left-0 top-0 w-[250px] bg-slate-900 h-screen py-8 text-gray-100
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} duration-1000    
            `}> 
                <CloseMenuButton/>

                <div className="flex justify-center">
                    <Image
                        className="rounded-full object-cover w-auto"
                        width={120}
                        height={150}
                        src={'/images/logo.jpg'} alt="logo"
                    />
                </div>
                <div className="mt-10">

                    <ul>
                        {
                            links.map((link, index) => <LinkButton key={index} link={link} />)
                        }
                    </ul>
                </div>
            </div>

        </div>

    )
}