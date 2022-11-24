import { useQuery } from "@tanstack/react-query";
import { ApiError, getMe } from "../api";
import { Token } from "../constants";
import { useTokenStore } from "../stores/useTokenStore";

export const useMe = () => {
	const tokenStore = useTokenStore();

	const query = useQuery(
		["me", tokenStore.accessToken],
		() => getMe(tokenStore as Token),
		{
			enabled: !!tokenStore.accessToken,
			refetchOnWindowFocus: false,
			retry(failureCount, error: ApiError) {
				if (error.status === 401 && failureCount === 0) {
					return false;
				}

				return true;
			},
		}
	);

	return {
		...query,
		data: tokenStore.accessToken ? query.data : null,
	};
};
