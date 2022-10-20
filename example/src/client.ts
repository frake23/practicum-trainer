import {CodeMirrorLanguageClient} from "codemirror-languageserver";
import {EditorView, basicSetup} from 'codemirror';
import {EditorState} from "@codemirror/state";
import {javascript} from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

const codeMirrorClient = new CodeMirrorLanguageClient({
    documentUri: 'user',
    languageId: 'javascript',
    serverUri: 'ws://localhost:8080'
});

let state = EditorState.create({
    extensions: [
        basicSetup,
        javascript(),
        codeMirrorClient.definePluginWithExtensions(),
        oneDark
    ]
})

let view = new EditorView({
    state,
    parent: document.getElementById("app")!
});

view.focus();
