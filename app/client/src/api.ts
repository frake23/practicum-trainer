import { AvailableLanguages } from "./constants";

const buildUrl = (path: string) => import.meta.env.VITE_HOST_URL + path;

export interface PostRunSnippetRequest {
	language: AvailableLanguages;
	content: string;
}

export interface PostRunSnippetResponse {
	stdout: string;
	stderr: string;
	exit_code: number;
}

export const postRunSnippet = async (body: PostRunSnippetRequest) => {
	const response = await fetch(buildUrl("/snippet/run"), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	const json = await response.json();

	return json as PostRunSnippetResponse;
};

export type PostShareSnippetRequest = PostRunSnippetRequest;

export interface PostShareSnippetResponse {
	id: string;
}

export const postShareSnippet = async (body: PostShareSnippetRequest) => {
	const response = await fetch(buildUrl("/snippet/share"), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	const json = await response.json();

	return json as PostShareSnippetResponse;
};

export interface GetShareSnippetRequest {
	snippetId: string;
}

export type GetShareSnippetResponse = PostRunSnippetRequest;

export const getShareSnippet = async (body: GetShareSnippetRequest) => {
	const response = await fetch(buildUrl(`/snippet/share/${body.snippetId}`), {
		method: "GET",
	});

	const json = await response.json();

	return json as GetShareSnippetResponse;
};
