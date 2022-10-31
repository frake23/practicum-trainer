import { useRef, useState } from "react";
import Select from "react-select";
import { useEditor } from "../hooks/useEditor";
import { PlayIcon } from "@heroicons/react/24/solid";
import { useMutation } from "@tanstack/react-query";
import { postRunSnippet } from "../api";

const options = [
	{ value: "python", label: "Python" },
	{ value: "javascript", label: "Javascript" },
] as const;

export const HomePage = () => {
	const [option, setOption] = useState<typeof options[number] | null>(
		options[0]
	);

	const [stdout, setStdout] = useState("");
	const [stderr, setStderr] = useState("");

	const editorRef = useRef(null);
	const { view } = useEditor(editorRef.current, {
		languageId: option?.value!,
		documentUri: `user/${option?.value}`,
	});

	const a = useMutation(['code'], postRunSnippet);
	a.data?.json()

	const onCodeRun = async () => {
		const content = view?.state.doc.sliceString(0);

		const resp = await fetch("http://localhost:8082/snippet/run", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				content,
			}),
		});

		const { stdout, stderr } = await resp.json();

		setStdout(stdout);
		setStderr(stderr);
	};

	return (
		<div>
			<div className='container mx-auto py-32 flex flex-col'>
				<div className='flex items-center gap-6 mb-2'>
					<span className=''>Язык программирования</span>
					<Select
						defaultValue={option}
						onChange={setOption}
						options={options}
					/>
				</div>
				<div className='flex gap-4 relative'>
					<div
						ref={editorRef}
						className='basis-1/2 rounded-xl shadow-md'
					/>
					<div className='basis-1/2 rounded-xl shadow-md p-8 whitespace-pre-line text-sm font-mono'>
						<div className='text-red-400'>{stderr}</div>
						<div className='text-green-400'>{stdout}</div>
					</div>
					<button
						className='absolute mx-auto bg-green-500 rounded-full p-4 translate-x-1/2 -translate-y-1/2 right-1/2 text-green-300 flex items-center gap-1'
						onClick={onCodeRun}
					>
						<PlayIcon className="w-4"/>
						Запустить
					</button>
				</div>
			</div>
		</div>
	);
};
