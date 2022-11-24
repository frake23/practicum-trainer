import { indentWithTab } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { EditorState, Text } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "@uiw/codemirror-extensions-basic-setup";
import { githubLight } from "@uiw/codemirror-theme-github";
import {
	CodeMirrorLanguageClient,
	BaseLanguageClientOptions,
} from "codemirror-languageserver";
import { useEffect, useRef, useState } from "react";
import { AvailableLanguages, languageToExtensionMap } from "../constants";
import { usePrevProp } from "./usePrevProps";

type UseEditorOptions = {
	languageId: AvailableLanguages;
	documentUri: string;
	workspaceFolders: BaseLanguageClientOptions["workspaceFolders"];
};

export const useEditor = (
	container: HTMLDivElement | null,
	options: UseEditorOptions
) => {
	const { languageId, documentUri } = options;
	const [parent, setParent] = useState<HTMLDivElement>();

	useEffect(() => setParent(container!), [container]);

	const prevDocumentUri = usePrevProp(documentUri);

	const [view, setView] = useState<EditorView | null>(null);
	const statesRef = useRef<Record<string, Text>>({});

	useEffect(() => {
		if (
			prevDocumentUri === null ||
			documentUri === prevDocumentUri ||
			!view
		) {
			return;
		}

		statesRef.current[prevDocumentUri] = view.state.doc;
	}, [documentUri, view]);

	useEffect(() => {
		if (!parent) return;

		setView(
			new EditorView({
				parent,
			})
		);
	}, [parent, setView]);

	useEffect(() => {
		if (!view || !languageId) return;

		const client = new CodeMirrorLanguageClient({
			documentUri,
			languageId,
			serverUri: "ws://localhost:8083",
			workspaceFolders: options.workspaceFolders,
		});

		const theme = EditorView.theme({
			"&": {
				height: "450px",
			},
		});

		const state = EditorState.create({
			extensions: [
				githubLight,
				languageToExtensionMap[languageId](),
				keymap.of([indentWithTab]),
				basicSetup(),
				client.definePluginWithExtensions(),
				theme,
				indentUnit.of("    "),
			],
			doc: statesRef.current[documentUri],
		});

		view.setState(state);
	}, [view, documentUri, languageId]);

	useEffect(() => {
		() => {
			view?.destroy();
		};
	}, []);

	return {
		view,
	};
};
