import { CodeMirrorLanguageClient } from "codemirror-languageserver";
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Extension } from "@codemirror/state";
import { javascript } from '@codemirror/lang-javascript';


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
    ]
})


let view = new EditorView({
    state,
    parent: document.getElementById("app")!
});

view.focus();
