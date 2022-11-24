import create from "zustand";

import { combine, persist } from "zustand/middleware";

import { Token } from "../constants";

type TokenStoreType = {
	[key in keyof Token]: Token[key] | null;
};

export const useTokenStore = create(
	persist(
		combine(
			{ accessToken: null, tokenType: null } as TokenStoreType,
			(set) => ({
				setToken: (token: Token) => set(token),
				clearToken: () => set({ accessToken: null, tokenType: null }),
			})
		),
		{
			name: "token",
		}
	)
);
