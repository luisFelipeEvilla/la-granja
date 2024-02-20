export type Link = {
  label: string;
  href: string;
  icon: any;
};
export default function LinkButton(props: { link: Link }) {
  return (
    <li className="flex items-center px-4 py-2 text-center border-t-[1px] border-slate-400 hover:bg-slate-800">
      <a href={props.link.href} className="flex">
        {
          props.link.icon
        }
        <p className="ml-2">{props.link.label}</p>
      </a>
    </li>
  );
}
