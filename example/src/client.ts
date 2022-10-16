import { CodeMirrorLanguageClient } from "codemirror-languageserver";
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from "@codemirror/state";
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
        EditorView.baseTheme({
            '.cm-tooltip.documentation': {
                display: 'block',
                marginLeft: '0',
                padding: '3px 6px 3px 8px',
                borderLeft: '5px solid #999',
                whiteSpace: 'pre',
            },
            '.cm-tooltip.lint': {
                whiteSpace: 'pre',
            },
        })
    ]
})


let view = new EditorView({
    state,
    parent: document.getElementById("app")!
});

view.focus();
