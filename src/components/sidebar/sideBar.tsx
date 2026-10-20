import {
  HiOutlineBanknotes,
  HiOutlineBeaker,
  HiOutlineClipboardDocumentList,
  HiOutlineCube,
  HiOutlineHome,
  HiOutlineTruck,
  HiOutlineUserGroup,
} from "react-icons/hi2";

import getUserFromCookies from "@/app/utils/getUserFromCookies";
import SideBarBody, { NavSection } from "./SideBarBody";

import { cookies } from "next/headers";

const iconClass = "h-5 w-5 shrink-0";

const adminSections: NavSection[] = [
  {
    title: "Operación",
    links: [
      { label: "Inicio", href: "/dashboard", icon: <HiOutlineHome className={iconClass} /> },
      { label: "Planillas", href: "/dashboard/sheets", icon: <HiOutlineClipboardDocumentList className={iconClass} /> },
      { label: "Producción", href: "/dashboard/production", icon: <HiOutlineBeaker className={iconClass} /> },
    ],
  },
  {
    title: "Compras",
    links: [
      { label: "Proveedores", href: "/dashboard/providers", icon: <HiOutlineTruck className={iconClass} /> },
      { label: "Liquidaciones", href: "/dashboard/invoices", icon: <HiOutlineBanknotes className={iconClass} /> },
    ],
  },
  {
    title: "Ventas",
    links: [
      { label: "Clientes", href: "/dashboard/clients", icon: <HiOutlineUserGroup className={iconClass} /> },
      { label: "Productos", href: "/dashboard/products", icon: <HiOutlineCube className={iconClass} /> },
    ],
  },
];

const userSections: NavSection[] = [
  {
    title: "Operación",
    links: [
      { label: "Planillas", href: "/dashboard/sheets", icon: <HiOutlineClipboardDocumentList className={iconClass} /> },
    ],
  },
];

export default function SideBar() {
  const user = getUserFromCookies(cookies());
  const isAdmin = user?.role === "ADMIN";

  return (
    <SideBarBody
      sections={isAdmin ? adminSections : userSections}
      user={{ name: user?.username ?? "", role: isAdmin ? "Administrador" : "Operario" }}
    />
  );
}
