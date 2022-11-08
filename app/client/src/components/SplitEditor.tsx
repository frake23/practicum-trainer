import { PlayIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { postRunSnippet } from "../api";
import { AvailableLanguages } from "../constants";
import { useEditor } from "../hooks/useEditor";
import { LoadingSpinner } from "./LoadingSpinner";
import { ShareButton } from "./ShareButton";

interface SplitEditorProps {
	language: AvailableLanguages;
	initText: string;
}

export const SplitEditor = ({ language, initText }: SplitEditorProps) => {
	const { mutate, data, isLoading } = useMutation(postRunSnippet);

	const editorRef = useRef(null);
	const { view } = useEditor(editorRef.current, {
		languageId: language,
		documentUri: `file:///main.${language}`,
		workspaceFolders: [],
	});

	const onCodeRun = () => {
		mutate({
			language,
			content: view!.state.doc.sliceString(0),
		});
	};

	useEffect(() => {
		view?.dispatch({
			changes: {
				from: 0,
				to: view.state.doc.length,
				insert: initText,
			},
		});
	}, [initText, view]);

	return (
		<div className='flex gap-4 relative'>
			<div
				ref={editorRef}
				className='basis-1/2 rounded-xl shadow-md relative'
			>
				<ShareButton
					getContent={() => view?.state.doc.sliceString(0)!}
					language={language}
					className='absolute bottom-2 left-2 z-50'
				/>
			</div>
			<div className='flex flex-col basis-1/2 rounded-xl shadow-md p-8 whitespace-pre-line text-sm font-mono'>
				{isLoading ? (
					<LoadingSpinner className='self-center justify-self-center h-10 w-10' />
				) : (
					<>
						<div className='text-red-400'>{data?.stderr}</div>
						<div className='text-green-400'>{data?.stdout}</div>
					</>
				)}
			</div>
			<button
				className='absolute mx-auto bg-green-500 rounded-full p-4 translate-x-1/2 -translate-y-1/2 right-1/2 text-green-300 flex items-center gap-1'
				onClick={onCodeRun}
			>
				<PlayIcon className='w-4' />
				Запустить
			</button>
		</div>
	);
};
