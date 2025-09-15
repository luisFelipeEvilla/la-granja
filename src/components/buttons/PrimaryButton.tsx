type Props = { 
    text: string;
    className?: string;
    type?: "button" | "submit" | "reset";
    onClick?: () => void;
    disabled?: boolean;
}

export default function PrimaryButton(props: Props) {
    return (
        <button
            type={props.type || "submit"}
            onClick={props.onClick}
            disabled={props.disabled}
            className={`
                w-full sm:w-auto inline-flex items-center justify-center 
                px-6 py-3 bg-green-600 hover:bg-green-700 
                disabled:bg-gray-400 disabled:cursor-not-allowed
                text-white font-medium rounded-lg 
                transition-colors duration-200 
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                min-h-[44px] text-sm sm:text-base
                ${props.className || ''}
            `}
        >
            {props.text}
        </button>
    )
}
