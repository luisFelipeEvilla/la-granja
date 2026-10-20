export default function CloseMenuButton(props: { setIsOpen: (value: boolean) => void }) {
  return (
    <button 
      onClick={() => props.setIsOpen(false)}
      className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      aria-label="Cerrar menú"
    >
      <svg
        className="w-6 h-6 text-slate-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}