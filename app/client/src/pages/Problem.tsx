import { PlayIcon } from "@heroicons/react/24/solid";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Select from "react-select";
import { getProblem, postRunSnippet, postSolveProblem } from "../api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { options } from "../constants";
import { useEditor } from "../hooks/useEditor";
import { useMe } from "../hooks/useMe";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { useTokenStore } from "../stores/useTokenStore";

export const ProblemPage = () => {
	useRequireAuth(true, "/login");

	const { data: me, isLoading: meIsLoading } = useMe();

	const { problemId } = useParams();

	const { accessToken, tokenType } = useTokenStore();

	const { data: problem, isLoading } = useQuery(
		["problem", problemId, accessToken],
		() =>
			getProblem({
				token: { accessToken: accessToken!, tokenType: tokenType! },
				problemId: problemId as string,
			})
	);

	const [option, setOption] = useState<typeof options[number]>(options[0]);

	const editorRef = useRef(null);

	const { view } = useEditor(editorRef.current, {
		languageId: option.value,
		documentUri: `file:///${me?.username}_${problemId}.${option.value}`,
		workspaceFolders: [],
	});

	const {
		mutate: runSnippet,
		data: runSnippetData,
		isLoading: isRunSnippetLoading,
	} = useMutation(postRunSnippet);

	const onCodeRun = () => {
		runSnippet({
			language: option.value,
			content: view!.state.doc.sliceString(0),
		});
	};

	const solved = !!problem?.solutions.find((solution) => solution.solved);

	const {
		mutate: solveProblem,
		isLoading: isSolveProblemLoading,
		data: solveProblemData,
	} = useMutation(postSolveProblem);

	const onSolveProblem = () => {
		solveProblem({
			token: { accessToken: accessToken!, tokenType: tokenType! },
			problemId: problemId!,
			solution: {
				language: option.value,
				content: view!.state.doc.sliceString(0),
			},
		});
	};

	if (meIsLoading) return <LoadingSpinner className='w-10 h-10 m-auto' />;

	return (
		<div className='flex flex-col flex-1'>
			<div className='container mx-auto my-16 px-4 flex flex-col flex-1 gap-4'>
				<div className='flex items-center gap-6 mb-2 self-end'>
					<span className=''>Язык программирования</span>
					<Select
						value={option}
						defaultValue={option}
						onChange={(option) => setOption(option!)}
						options={options}
					/>
				</div>
				<div className='flex gap-4'>
					<div className='rounded-xl shadow-md p-4 border flex-1'>
						{isLoading && !problem ? (
							<LoadingSpinner className='w-10 h-10 m-auto' />
						) : (
							<>
								<h1 className='font-bold mb-2 flex justify-between'>
									{problem!.name}
									{solved ? (
										<div className='text-green-400'>
											Решено!
										</div>
									) : null}
								</h1>
								<div className='text-sm font-semibold'>
									Условие задания
								</div>
								<div className='text-sm'>{problem!.text}</div>
							</>
						)}
					</div>
					<div
						ref={editorRef}
						className='basis-1/2 rounded-xl shadow-md'
					/>
				</div>
				<div className='flex flex-1 rounded-xl shadow-md border gap-4'>
					<div className='flex-1 h-full border-r p-4 relative'>
						{isSolveProblemLoading ? (
							<LoadingSpinner className='self-center justify-self-center h-10 w-10' />
						) : (
							<div className='flex flex-col gap-2'>
								{solveProblemData?.map((solution, i) => (
									<div key={i}>
										{solution.is_error ? (
											<div className='text-red-700'>
												<span>{i + 1}. </span>
												Ошибка при исполнении
											</div>
										) : solution.is_solved ? (
											<div className='text-green-500'>
												<span>{i + 1}. </span>
												Тест пройден
											</div>
										) : (
											<div className='text-red-500'>
												<span>{i + 1}. </span>
												Неверный вывод
											</div>
										)}
									</div>
								))}
							</div>
						)}
						<button
							className='absolute right-4 bottom-4 p-2 flex gap-1 items-center text-white bg-blue-500 rounded-full text-sm'
							onClick={onSolveProblem}
						>
							<PlayIcon className='w-4' />
							Проверить
						</button>
					</div>
					<div className='flex-1 h-full p-4 relative whitespace-pre-line'>
						{isRunSnippetLoading ? (
							<LoadingSpinner className='self-center justify-self-center h-10 w-10' />
						) : (
							<>
								<div className='text-red-400'>
									{runSnippetData?.stderr}
								</div>
								<div className='text-green-400'>
									{runSnippetData?.stdout}
								</div>
							</>
						)}
						<button
							className='absolute right-4 bottom-4 p-2 flex gap-1 items-center text-white bg-green-500 rounded-full text-sm'
							onClick={onCodeRun}
						>
							<PlayIcon className='w-4' />
							Запустить
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
