export type Link = {
  label: string;
  href: string;
  icon: any;
};
export default function LinkButton(props: { link: Link; active?: boolean }) {
  return (
    <li>
      <a
        href={props.link.href}
        aria-current={props.active ? "page" : undefined}
        className={`flex items-center px-4 py-3 text-gray-100 rounded-lg transition-colors duration-200 ${
          props.active ? "bg-slate-700" : "hover:bg-slate-800"
        }`}
      >
        <span className="flex-shrink-0">
          {props.link.icon}
        </span>
        <span className="ml-3 text-base lg:text-sm font-medium">{props.link.label}</span>
      </a>
    </li>
  );
}
