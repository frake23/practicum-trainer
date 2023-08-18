import {CodeMirrorLanguageClient} from "codemirror-languageserver";
import {EditorView, basicSetup} from 'codemirror';
import {EditorState} from "@codemirror/state";
import {python} from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { v4 } from "uuid";

const codeMirrorClient = new CodeMirrorLanguageClient({
    documentUri: `file://${v4()}`,
    languageId: 'python',
    serverUri: 'ws://localhost:8083'
});

let state = EditorState.create({
    extensions: [
        basicSetup,
        python(),
        codeMirrorClient.definePluginWithExtensions(),
        oneDark
    ]
})

let view = new EditorView({
    state,
    parent: document.getElementById("app")!
});

view.focus();
