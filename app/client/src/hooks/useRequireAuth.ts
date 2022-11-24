import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMe } from "./useMe";

export const useRequireAuth = (required: boolean = true, to: string = "/") => {
	const { data, isFetching } = useMe();

	const navigate = useNavigate();

	useEffect(() => {
		if (
			(required && !isFetching && !data?.username) ||
			(!required && !isFetching && data?.username)
		) {
			navigate(to);
		}
	}, [data, isFetching, required, to]);
};
