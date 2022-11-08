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
