export default function OpenMenuBotton(props: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => props.setIsOpen(true)}
      className="p-2 rounded-lg text-gray-100 hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
      aria-label="Abrir menú"
      aria-expanded={props.isOpen}
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
