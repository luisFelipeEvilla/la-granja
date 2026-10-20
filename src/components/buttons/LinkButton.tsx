import NextLink from "next/link";

export type Link = {
  label: string;
  href: string;
  icon: any;
};

type Props = { link: Link, active: boolean, onNavigate?: () => void };

// full row on phones (drawer) and large screens, icon with a small label on the iPad portrait rail
export default function LinkButton({ link, active, onNavigate }: Props) {
  return (
    <li>
      <NextLink
        href={link.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`
          flex items-center rounded-lg transition-colors duration-200
          px-4 py-3 md:flex-col md:px-1 md:py-2 lg:flex-row lg:px-4 lg:py-3
          ${active ? "bg-slate-700 text-white" : "text-gray-100 hover:bg-slate-800 active:bg-slate-800"}
        `}
      >
        <span className="flex-shrink-0">
          {link.icon}
        </span>
        <span className="ml-3 text-sm font-medium md:ml-0 md:mt-1 md:text-[11px] md:leading-tight md:text-center lg:ml-3 lg:mt-0 lg:text-sm lg:text-left">
          {link.label}
        </span>
      </NextLink>
    </li>
  );
}
