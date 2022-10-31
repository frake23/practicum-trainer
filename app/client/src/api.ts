import { AvailableLanguages } from "./constants";

const buildUrl = (path: string) => import.meta.env.VITE_HOST_URL + path;

export interface PostRunSnippetRequest {
	language: AvailableLanguages;
	content: string;
}

export interface PostRunSnippetResponse {}

export const postRunSnippet = (body: PostRunSnippetRequest) => {
	return fetch(buildUrl("/snippet/run"), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
};
