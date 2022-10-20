import { CodeMirrorLanguageClient } from "codemirror-languageserver";
import { useEffect, useRef, useState } from "react";
import { python } from "@codemirror/lang-python";
import { githubLight } from "@uiw/codemirror-theme-github";
import { EditorState, Text } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { basicSetup } from "@uiw/codemirror-extensions-basic-setup";
import { javascript } from "@codemirror/lang-javascript";
import { indentUnit } from "@codemirror/language";
import { usePrevProp } from "../hooks/usePrevProps";

const languageToExtensionMap = {
	python,
	javascript,
};

interface EditorProps {
	languageId: keyof typeof languageToExtensionMap;
	documentUri: string;
	className?: string;
}

export const Editor = ({ languageId, documentUri, className }: EditorProps) => {
	const prevDocumentUri = usePrevProp(documentUri);

	console.log({prevDocumentUri})

	const editor = useRef(null);
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
		if (!editor.current) return;

		setView(
			(view) =>
				view ||
				new EditorView({
					parent: editor.current!,
				})
		);
	}, [editor.currxent, setView]);

	useEffect(() => {
		if (!view) return;

		const client = new CodeMirrorLanguageClient({
			documentUri,
			languageId,
			serverUri: "ws://localhost:8080",
		});

		const theme = EditorView.theme({
			"&": {
				height: "400px",
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
	}, [view, documentUri]);

	useEffect(() => {
		() => {
			view?.destroy();
		};
	}, []);

	return (
		<div
			ref={editor}
			className={`rounded-xl shadow-md ${className ?? ""}`}
		/>
	);
};
