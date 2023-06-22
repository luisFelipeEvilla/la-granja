import { MdAddBusiness } from "react-icons/md";

export default function SideBar() {

    const links = [{ label: 'Provedores', href: '/providers', icon: MdAddBusiness }]

    return (
        <div className="bg-slate-900 w-fit h-screen py-8 text-gray-100">
            <div className="flex justify-center">
                <img className="rounded-full h-[80px] w-[80px] " src="/logo.png" alt="logo" />
            </div>
            <div className="">
                <ul>
                    {
                        links.map((link, index) =>
                            <li key={index}>
                                <a href={link.href} 
                                    className="flex gap-2 items-center px-3 my-4 text-base ">
                                    {<link.icon className="fill-gray-100" />}
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