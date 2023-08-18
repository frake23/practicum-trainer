import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { StreamLanguage } from "@codemirror/language";
import { go } from "@codemirror/legacy-modes/mode/go";

export const languageToExtensionMap = {
	python,
	javascript,
	go: () => StreamLanguage.define(go),
};

export type AvailableLanguages = keyof typeof languageToExtensionMap;

export const options = [
	{ value: "python", label: "Python" },
	{ value: "go", label: "Go" },
	{value: "javascript", label: "JS"}
] as const;

export const usedLanguages = Object.values(options).map(
	(option) => option.value
) as string[];

export interface UserBase {
	username: string;
}

export interface Token {
	accessToken: string;
	tokenType: string;
}

export interface ProblemBase {
	name: string;
	text: string;
	complexity: number;
}

export interface SolutionBase {
	content: string;
	language: AvailableLanguages;
	solved?: boolean | null;
}
