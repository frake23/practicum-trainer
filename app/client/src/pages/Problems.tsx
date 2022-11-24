import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { getProblems } from "../api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { useTokenStore } from "../stores/useTokenStore";

const getIcon = (solved: boolean | null) => {
	if (solved === null) {
		return <div className='rounded-full w-6 h-6 bg-gray-300' />;
	}

	if (solved) {
		return <CheckIcon className='text-green-400 w-6 h-6' />;
	}

	return <XMarkIcon className='text-red-400 w-6 h-6' />;
};

const getComplexityText = (complexity: number) => {
	let text: string;
	let colorClass: string;
	let bgClass: string;
	let wClass: string;

	switch (complexity) {
		case 1:
			text = "Очень легко";
			colorClass = "text-green-500";
			bgClass = "bg-green-500";
			wClass = "w-1/5";
			break;
		case 2:
			text = "Легко";
			colorClass = "text-lime-500";
			bgClass = "bg-lime-500";
			wClass = "w-2/5";
			break;
		case 3:
			text = "Средне";
			colorClass = "text-yellow-500";
			bgClass = "bg-yellow-500";
			wClass = "w-3/5";
			break;
		case 4:
			text = "Сложно";
			colorClass = "text-orange-500";
			bgClass = "bg-orange-500";
			wClass = "w-4/5";
			break;
		case 5:
			text = "Очень сложно";
			colorClass = "text-red-500";
			bgClass = "bg-red-500";
			wClass = "w-full";
			break;
		default:
			text = "Мистическая";
			colorClass = "text-black";
			bgClass = "bg-black";
			wClass = "w-full";
			break;
	}

	return (
		<div className={`flex items-center gap-2 text-xs ${colorClass}`}>
			{text}
			<div className='border rounded-full w-8 h-2'>
				<div className={`${wClass} h-full ${bgClass}`} />
			</div>
		</div>
	);
};

export const ProblemsPage = () => {
	useRequireAuth(true, "/login");

	const { accessToken, tokenType } = useTokenStore();

	const { data, isLoading } = useQuery(["problems", accessToken], () =>
		getProblems({ accessToken: accessToken!, tokenType: tokenType! })
	);

	return (
		<div className='flex flex-col'>
			<div className='flex flex-col container mx-auto my-16 gap-4 px-4'>
				{isLoading && !data ? (
					<LoadingSpinner className='w-10 h-10 m-auto' />
				) : (
					data?.map((value) => (
						<Link
							className='flex p-4 rounded-full border shadow-md items-center justify-between'
							key={value.id}
							to={`/problems/${value.id}`}
						>
							<div className='flex items-center gap-4'>
								{getIcon(value.solved)}
								<span className='font-semibold'>
									{value.name}
								</span>
								<div className='text-xs whitespace-nowrap text-ellipsis'>
									{value.text}
								</div>
							</div>
							{getComplexityText(value.complexity)}
						</Link>
					))
				)}
			</div>
		</div>
	);
};
