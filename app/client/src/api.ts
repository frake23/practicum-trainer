import {
	AvailableLanguages,
	ProblemBase,
	SolutionBase,
	Token,
	UserBase,
} from "./constants";

type MakeRequestArgs = {
	path: string;
	method: string;
	token?: Token;
	body?: any;
	isBodyJson?: boolean;
};

export type ApiError = {
	status: number;
	json: any;
}

const makeRequest = async ({
	path,
	method,
	token,
	body,
	isBodyJson = true,
}: MakeRequestArgs): Promise<any> => {
	const headers = {} as Record<string, string>;

	const requestInit: RequestInit = { method, headers };

	if (token) {
		const { tokenType, accessToken } = token;
		headers["Authorization"] = `${
			tokenType[0].toLocaleUpperCase() + tokenType.slice(1)
		} ${accessToken}`;
	}

	if (body) {
		if (isBodyJson) {
			headers["Content-Type"] = "application/json";
			requestInit["body"] = JSON.stringify(body);
		} else {
			requestInit["body"] = body;
		}
	}

	const response = await fetch(
		import.meta.env.VITE_HOST_URL + path,
		requestInit
	);

	if (!response.ok) {
		throw {
			status: response.status,
			json: await response.json(),
		} as const;
	}

	return response.json();
};

export type PostRunSnippetRequest = {
	language: AvailableLanguages;
	content: string;
};

export type PostRunSnippetResponse = {
	stdout: string;
	stderr: string;
	exit_code: number;
};

export const postRunSnippet = (
	body: PostRunSnippetRequest
): Promise<PostRunSnippetResponse> => {
	return makeRequest({
		path: "/snippet/run",
		method: "POST",
		body,
	});
};

export type PostShareSnippetRequest = PostRunSnippetRequest;

export type PostShareSnippetResponse = {
	id: string;
};

export const postShareSnippet = (
	body: PostShareSnippetRequest
): Promise<PostShareSnippetResponse> => {
	return makeRequest({
		path: "/snippet/share",
		method: "POST",
		body,
	});
};

export type GetShareSnippetRequest = {
	snippetId: string;
};

export type GetShareSnippetResponse = PostRunSnippetRequest;

export const getShareSnippet = (
	body: GetShareSnippetRequest
): Promise<GetShareSnippetResponse> => {
	return makeRequest({
		path: `/snippet/share/${body.snippetId}`,
		method: "GET",
	});
};

export type PostRegisterRequest = UserBase & {
	password: string;
};

export type PostRegisterResponse = UserBase;

export const postRegister = async (
	body: PostRegisterRequest
): Promise<PostRegisterResponse> => {
	return makeRequest({
		path: "/auth/register",
		method: "POST",
		body,
	});
};

export type PostLoginRequest = PostRegisterRequest;

export type PostLoginResponse = {
	access_token: string;
	token_type: string;
};

export const postLogin = (
	body: PostLoginRequest
): Promise<PostLoginResponse> => {
	const formData = new FormData();

	Object.entries(body).forEach((entry: [string, string]) =>
		formData.append(...entry)
	);

	return makeRequest({
		path: "/auth/token",
		method: "POST",
		body: formData,
		isBodyJson: false,
	});
};

export type GetMeRequest = Token;

export type GetMeResponse = UserBase;

export const getMe = async (token: GetMeRequest): Promise<GetMeResponse> => {
	return makeRequest({
		path: "/auth/me",
		method: "GET",
		token,
	});
};

export type GetProblemsRequest = Token;

export type GetProblemsResponse = (ProblemBase & {
	id: string;
	solved: boolean | null;
})[];

export const getProblems = (
	token: GetProblemsRequest
): Promise<GetProblemsResponse> => {
	return makeRequest({
		path: "/problems",
		method: "GET",
		token,
	});
};

export type GetProblemRequest = {
	token: Token;
	problemId: string;
};

export type GetProblemResponse = ProblemBase & {
	solutions: SolutionBase[];
};

export const getProblem = ({
	token,
	problemId,
}: GetProblemRequest): Promise<GetProblemResponse> => {
	return makeRequest({
		path: `/problems/${problemId}`,
		method: "GET",
		token,
	});
};

export type PostSolveProblemRequest = {
	token: Token;
	problemId: string;
	solution: SolutionBase;
};

export type PostSolveProblemResponse = {
	is_error: boolean;
	is_solved: boolean;
}[];

export const postSolveProblem = ({
	token,
	problemId,
	...body
}: PostSolveProblemRequest): Promise<PostSolveProblemResponse> => {
	return makeRequest({
		path: `/problems/${problemId}/solve`,
		method: "POST",
		body: body.solution,
		token,
	});
};
