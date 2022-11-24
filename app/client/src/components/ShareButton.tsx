import { ShareIcon } from "@heroicons/react/24/outline";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { postShareSnippet } from "../api";
import { AvailableLanguages } from "../constants";

interface ShareButtonProps {
	getContent: () => string;
	language: AvailableLanguages;
	className?: string;
}

export const ShareButton = ({
	className,
	language,
	getContent,
}: ShareButtonProps) => {
	const { data, mutate } = useMutation(postShareSnippet);

	useEffect(() => {
		if (data) {
			toast.promise(
				navigator.clipboard.writeText(
					`${window.location.host}/${data.id}`
				),
				{
					pending: "Загрузка",
					success: "Ссылка скопирована",
				}
			);
		}
	}, [data]);

	const onShare = () => mutate({ language, content: getContent() });

	return (
		<button
			className={`flex items-center gap-1 p-2 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-all ${
				className ?? ""
			}`}
			onClick={onShare}
		>
			<ShareIcon className='w-4' />
			Поделиться
		</button>
	);
};
