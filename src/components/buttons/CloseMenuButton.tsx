export default function CloseMenuButton(props: { setIsOpen: (value: boolean) => void }) {
  return (
    <button onClick={() => props.setIsOpen(false)}>
      <svg
        className="w-11 h-11 top-2 left-2 absolute"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  );
}