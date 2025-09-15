export type Link = {
  label: string;
  href: string;
  icon: any;
};
export default function LinkButton(props: { link: Link }) {
  return (
    <li>
      <a 
        href={props.link.href} 
        className="flex items-center px-4 py-3 text-gray-100 rounded-lg hover:bg-slate-800 transition-colors duration-200"
      >
        <span className="flex-shrink-0">
          {props.link.icon}
        </span>
        <span className="ml-3 text-sm font-medium">{props.link.label}</span>
      </a>
    </li>
  );
}
