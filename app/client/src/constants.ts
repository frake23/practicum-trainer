import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";

export const languageToExtensionMap = {
	python,
	javascript,
};

export type AvailableLanguages = keyof typeof languageToExtensionMap;