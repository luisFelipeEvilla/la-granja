export default function CloseMenuButton(props: { setIsOpen: (value: boolean) => void }) {
  return (
    <button 
      onClick={() => props.setIsOpen(false)}
      className="p-2 rounded-lg hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-slate-900"
      aria-label="Cerrar menú"
    >
      <svg
        className="w-6 h-6 text-gray-300 hover:text-white"
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