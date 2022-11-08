import { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import { useEditor } from "../hooks/useEditor";
import { PlayIcon } from "@heroicons/react/24/solid";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getShareSnippet, postRunSnippet } from "../api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useNavigate, useParams } from "react-router-dom";
import { ShareButton } from "../components/ShareButton";
import { Text } from "@codemirror/state";
import { SplitEditor } from "../components/SplitEditor";
import { AvailableLanguages } from "../constants";

const options = [
	{ value: "python", label: "Python" },
	{ value: "go", label: "Go" },
] as const;

const usedLanguages = Object.values(options).map((option) => option.value) as string[];

export const HomePage = () => {
	const { entity } = useParams();

	const navigate = useNavigate();

	const [snippetId] = useState(() => {
		if (usedLanguages.includes(entity!)) {
			return null;
		}

		return entity ?? null;
	});

	const [option, setOption] = useState<typeof options[number] | null>(null);

	const { data, isLoading } = useQuery(
		["snippets", snippetId],
		() => getShareSnippet({ snippetId: snippetId! }),
		{ enabled: !!snippetId }
	);

	useEffect(() => {
		if (!snippetId && !usedLanguages.includes(entity!)) {
			return navigate(`/${options[0].value}`);
		}

		if (data) {
			navigate(`/${data.language}`);
		}
	}, [snippetId, data]);

	useEffect(() => {
		const option = Object.values(options).find(
			(option) => option.value === entity
		);

		setOption(option!);
	}, [entity]);

	if ((isLoading && snippetId) || !option) {
		return <LoadingSpinner className='w-10 h-10 m-auto' />;
	}

	return (
		<div>
			<div className='container mx-auto py-32 flex flex-col'>
				<div className='flex items-center gap-6 mb-2'>
					<span className=''>Язык программирования</span>
					<Select
						value={option}
						defaultValue={option}
						onChange={(option) => navigate(`/${option!.value}`)}
						options={options}
					/>
				</div>
				<SplitEditor
					language={option?.value}
					initText={data?.content ?? ""}
				/>
			</div>
		</div>
	);
};
