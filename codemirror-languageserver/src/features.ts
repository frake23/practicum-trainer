import { Extension } from "@codemirror/state";
import * as LSP from 'vscode-languageserver-protocol';
import { CodeMirrorLanguageClient } from './client';

export interface IFeature {
    method: string,
    initialize(capabilities: LSP.ServerCapabilities): void,
    fillClientCapabilities(capabilities: LSP.ClientCapabilities): void;
}

export interface ICodeMirrorFeature extends IFeature {
    getExtension(): Extension | null;
}

export abstract class DefaultCodeMirrorFeature implements ICodeMirrorFeature {
    public method: string;
    protected _client: CodeMirrorLanguageClient;

    constructor(client: CodeMirrorLanguageClient) {
        this._client = client;
    }

    abstract initialize(capabilities: LSP.ServerCapabilities): void;

    abstract fillClientCapabilities(capabilities: LSP.ClientCapabilities): void;

    getExtension(): Extension | null {
        return null;
    };
}

export class DidOpenTextDocumentFeature extends DefaultCodeMirrorFeature {
    public method: string = 'textDocument/didOpen';

    fillClientCapabilities(capabilities: LSP.ClientCapabilities): void {

    }


    public initialize(capabilities: LSP.ServerCapabilities): void {
        const params: LSP.DidOpenTextDocumentParams = {
            textDocument: {
                uri: this._client.documentUri,
                languageId: this._client.languageId,
                text: this._client.plugin?.viewText ?? '',
                version: this._client.docVersion,
            }
        };

        this._client.sendNotification(
            this.method,
            params
        );
    }
}

export class DidChangeTextDocumentFeature extends DefaultCodeMirrorFeature {
    public method: string = 'textDocument/didChange';

    fillClientCapabilities(capabilities: LSP.ClientCapabilities): void {

    }

    public initialize(): void {
        this._client.plugin?.setOnUpdate(({ docChanged }) => {
            if (!docChanged) return;

            const params: LSP.DidChangeTextDocumentParams = {
                textDocument:
                {
                    uri: this._client.documentUri,
                    version: this._client.docVersion,
                },
                contentChanges: [{ text: this._client.plugin!.viewText }]
            }

            this._client.sendNotification(
                this.method,
                params,
                500
            )
        })
    }
}

export class PublishDiagnosticsFeature extends DefaultCodeMirrorFeature {
    public method: string = 'textDocument/publishDiagnostics';

    fillClientCapabilities(capabilities: LSP.ClientCapabilities): void {

    }

    public initialize(): void {
        this._client.onNotification(this.method, (params: LSP.PublishDiagnosticsParams) => {

        })
    }
}

export class CompletionFeature extends DefaultCodeMirrorFeature {
    method: string = 'textDocument/completion';

    fillClientCapabilities(capabilities: LSP.ClientCapabilities): void {

    }


    async initialize(): Promise<void> {

    }

    getExtension() {
        return null;
    }
}
