import { useEffect, useRef, useState } from "react";
import Select from "react-select";
import { useQuery } from "@tanstack/react-query";
import { getShareSnippet } from "../api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useNavigate, useParams } from "react-router-dom";
import { HomeSplitEditor } from "../components/HomeSplitEditor";
import { options, usedLanguages } from "../constants";


export const HomePage = () => {
	const { entity } = useParams();

	const navigate = useNavigate();

	const { current: snippetId } = useRef<string | null>(
		usedLanguages.includes(entity!) ? null : entity!
	);

	const [option, setOption] = useState<typeof options[number] | null>(null);

	const { data, isLoading } = useQuery(
		["snippets", snippetId],
		() => getShareSnippet({ snippetId: snippetId! }),
		{ enabled: !!snippetId }
	);

	useEffect(() => {
		if (snippetId && data && data.language) {
			return navigate(`/${data.language}`);
		}

		if (!usedLanguages.includes(entity!)) {
			return navigate(`/${options[0].value}`);
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
		<div className='container mx-auto my-32 flex flex-col px-4'>
			<div className='flex items-center gap-6 mb-2'>
				<span className=''>Язык программирования</span>
				<Select
					value={option}
					defaultValue={option}
					onChange={(option) => navigate(`/${option!.value}`)}
					options={options}
				/>
			</div>
			<HomeSplitEditor
				language={option?.value}
				initText={data?.content ?? ""}
			/>
		</div>
	);
};
