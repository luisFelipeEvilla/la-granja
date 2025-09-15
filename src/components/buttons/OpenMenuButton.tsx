export default function OpenMenuBotton(props: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  return props.isOpen ? null : (
    <button 
      onClick={() => props.setIsOpen(true)}
      className="p-2 rounded-lg bg-white shadow-md hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Abrir menú"
    >
      <svg
        className="w-6 h-6 text-gray-700"
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
