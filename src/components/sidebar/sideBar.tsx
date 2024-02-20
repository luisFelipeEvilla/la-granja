import { MdAddBusiness } from "react-icons/md";
import { BiSpreadsheet, BiHome } from "react-icons/bi";
import { LiaFileInvoiceDollarSolid } from "react-icons/lia";

import getUserFromCookies from "@/app/utils/getUserFromCookies";
import SideBarBody from "./SideBarBody";

import { cookies } from "next/headers";

export default function SideBar() {
  const cookieStore = cookies();
  const user = getUserFromCookies(cookieStore);

  const AdminLinks = [
    { label: "Inicio", href: "/dashboard", icon: <BiHome className="fill-gray-100 text-2xl" /> },
    { label: "Provedores", href: "/dashboard/providers", icon: <MdAddBusiness className="fill-gray-100 text-2xl" /> },
    { label: "Planillas", href: "/dashboard/sheets", icon: <BiSpreadsheet className="fill-gray-100 text-2xl" /> },
    {
      label: "Facturación",
      href: "/dashboard/invoices",
      icon: <LiaFileInvoiceDollarSolid className="fill-gray-100 text-2xl" />,
    },
    { label: "Producción", href: "/dashboard/production", icon: <BiSpreadsheet className="fill-gray-100 text-2xl" /> },
  ];

  const userLinks = [
    { label: "Planillas", href: "/dashboard/sheets", icon: <BiSpreadsheet className="fill-gray-100 text-2xl" /> },
  ]

  return (
    <SideBarBody links={user?.role === "ADMIN" ? AdminLinks : userLinks} />
  )
}
