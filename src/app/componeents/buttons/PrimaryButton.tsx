type Props = { text: string }
export default function PrimaryButton(props: Props) {
    return (
        <button
            className="rounded-md bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition duration-300 ease-in-out"
        >{props.text}</button>
    )
}
