import { MdAddBusiness } from "react-icons/md";

export default function SideBar() {

    const links = [{ label: 'Provedores', href: '/providers', icon: MdAddBusiness }]

    return (
        <div className="w-[250px] bg-slate-900 h-screen py-8 text-gray-100">
            <div className="flex justify-center">
                <img className="rounded-full h-[120px] w-[120px] " src="/logo.png" alt="logo" />
            </div>
            <div className="">
                <ul>
                    {
                        links.map((link, index) =>
                            <li key={index} className="flex items-center px-4 py-2 text-center border-t-[1px] border-slate-400 hover:bg-slate-800">
                                <a href={link.href} 
                                    className="flex gap-2">
                                    {<link.icon className="fill-gray-100 text-2xl" />}
                                    {link.label}
                                </a>
                            </li>
                        )
                    }
                </ul>
            </div>
        </div>

    )
}