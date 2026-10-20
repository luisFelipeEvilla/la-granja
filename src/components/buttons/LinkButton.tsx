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
        title={link.label}
        className={`
          group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors duration-150
          px-3 py-2.5 md:flex-col md:gap-1 md:px-1 md:py-2 lg:flex-row lg:gap-3 lg:px-3 lg:py-2.5
          ${active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}
        `}
      >
        {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-emerald-400 md:hidden lg:block" />}
        <span className={active ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}>{link.icon}</span>
        <span className="md:text-center md:text-[11px] md:leading-tight lg:text-left lg:text-sm">{link.label}</span>
      </NextLink>
    </li>
  );
}
