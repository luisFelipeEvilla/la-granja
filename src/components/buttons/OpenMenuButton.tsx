export default function OpenMenuBotton(props: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  return props.isOpen ? null : (
    <button 
      onClick={() => props.setIsOpen(true)}
      className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-200 hover:bg-white/10 transition-colors duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400"
      aria-label="Abrir menú"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
}
