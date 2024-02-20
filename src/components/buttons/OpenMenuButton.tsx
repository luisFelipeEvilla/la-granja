export default function OpenMenuBotton(props: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  return props.isOpen ? (
    ""
  ) : (
    <button onClick={() => props.setIsOpen(true)}>
      <svg
        className="w-11 h-11 top-2 left-2 absolute "
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
        ></path>
      </svg>
    </button>
  );
}
