import { Extension } from "@codemirror/state";
import * as LSP from 'vscode-languageserver-protocol';
import { CodeMirrorLanguageClient } from './language-client';


export interface IFeature {
    method: string,
    register: () => void,
}

export interface ICodeMirrorFeature extends IFeature {
    getExtension(): Extension | null;
}

export abstract class DefaultCodeMirrorFeature implements ICodeMirrorFeature {
    public method: string;
    protected client: CodeMirrorLanguageClient;

    constructor(client: CodeMirrorLanguageClient) {
        this.client = client;
    }

    abstract register(): void;

    getExtension(): Extension | null {
        return null;
    };
}

export class DidOpenTextDocumentFeature extends DefaultCodeMirrorFeature {
    public method: string = 'textDocument/didOpen';

    public register(): void {
        this.client.sendNotification<LSP.DidOpenTextDocumentParams>(
            this.method,
            {
                textDocument: {
                    uri: this.client.documentUri,
                    languageId: this.client.languageId,
                    text: this.client.plugin?.viewText ?? '',
                    version: this.client.docVersion,
                }
            }
        )
    }
}

export class DidChangeTextDocumentFeature extends DefaultCodeMirrorFeature {
    public method: string = 'textDocument/didChange';

    public register(): void {
        this.client.plugin?.setOnUpdate(({ docChanged }) => {
            if (!docChanged) return;
            this.client.sendNotification<LSP.DidChangeTextDocumentParams>(
                this.method,
                {
                    textDocument:
                    {
                        uri: this.client.documentUri,
                        version: this.client.docVersion,
                    },
                    contentChanges: [{ text: this.client.plugin!.viewText }]
                },
                500
            )
        })
    }
}

export class CompletionFeature extends DefaultCodeMirrorFeature {
    method: string = 'textDocument/completion';

    async register(): Promise<void> {
        
    }

    getExtension() {
        return null;
    }
}
