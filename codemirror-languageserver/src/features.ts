import { Extension } from "@codemirror/state";
import { setDiagnostics } from '@codemirror/lint';
import { Text } from '@codemirror/state'
import { CodeMirrorLanguageClient } from './client';
import { ClientCapabilities, DidChangeTextDocumentParams, DidOpenTextDocumentParams, PublishDiagnosticsParams, ServerCapabilities } from "vscode-languageserver-protocol";

export function ensure<T, K extends keyof T>(target: T, key: K): T[K] {
    if (target[key] === undefined) {
        target[key] = {} as any;
    }
    return target[key];
}

export interface IFeature {
    initialize(capabilities: ServerCapabilities): void,
    fillClientCapabilities(capabilities: ClientCapabilities): void;
}

export interface ICodeMirrorFeature extends IFeature {
    getExtension(): Extension | null;
}

export abstract class DefaultCodeMirrorFeature implements ICodeMirrorFeature {
    protected _client: CodeMirrorLanguageClient;

    constructor(client: CodeMirrorLanguageClient) {
        this._client = client;
    }

    abstract initialize(capabilities: ServerCapabilities): void;

    abstract fillClientCapabilities(capabilities: ClientCapabilities): void;

    getExtension(): Extension | null {
        return null;
    };
}

export class DidOpenTextDocumentFeature extends DefaultCodeMirrorFeature {
    private _method: string = 'textDocument/didOpen';

    public fillClientCapabilities(capabilities: ClientCapabilities): void {
        ensure(ensure(capabilities, 'textDocument')!, 'synchronization')!.dynamicRegistration = true;
    }

    public initialize(capabilities: ServerCapabilities): void {
        const params: DidOpenTextDocumentParams = {
            textDocument: {
                uri: this._client.documentUri,
                languageId: this._client.languageId,
                text: this._client.plugin?.viewString ?? '',
                version: this._client.docVersion,
            }
        };

        this._client.sendNotification(
            this._method,
            params
        );
    }
}

export class DidChangeTextDocumentFeature extends DefaultCodeMirrorFeature {
    public method: string = 'textDocument/didChange';

    public fillClientCapabilities(capabilities: ClientCapabilities): void {
        ensure(ensure(capabilities, 'textDocument')!, 'synchronization')!.dynamicRegistration = true;
    }

    public initialize(): void {
        this._client.plugin?.setOnUpdate(({ docChanged }) => {
            if (!docChanged) return;

            const params: DidChangeTextDocumentParams = {
                textDocument:
                {
                    uri: this._client.documentUri,
                    version: this._client.docVersion,
                },
                contentChanges: [{ text: this._client.plugin!.viewString }]
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

    public fillClientCapabilities(capabilities: ClientCapabilities): void {
        const diagnostics = ensure(ensure(capabilities, 'textDocument')!, 'publishDiagnostics')!;
        diagnostics.relatedInformation = true;
        diagnostics.versionSupport = false;
        diagnostics.tagSupport = { valueSet: [1, 2] };
        diagnostics.codeDescriptionSupport = true;
        diagnostics.dataSupport = true;
    }

    public initialize(_capabilities: ServerCapabilities): void {
        this._client.onNotification(this.method, (params: PublishDiagnosticsParams) => {
            if (!this._client.plugin) return;
            
            const view = this._client.plugin.view;
            const text = this._client.plugin.viewText;

            const diagnostics = params.diagnostics
                .map(({ range, message, severity }) => ({
                    from: posToOffset(text, range.start)!,
                    to: posToOffset(text, range.end)!,
                    severity: ({
                        1: 'error',
                        2: 'warning',
                        3: 'info',
                        4: 'info',
                    } as const)[severity!],
                    message,
                }))
                .filter(({ from, to }) => from !== null && to !== null && from !== undefined && to !== undefined)
                .sort((a, b) => {
                    return a.from - b.from;
                });

            view.dispatch(setDiagnostics(view.state, diagnostics));
        })
    }
}

export class CompletionFeature extends DefaultCodeMirrorFeature {
    method: string = 'textDocument/completion';

    fillClientCapabilities(capabilities: ClientCapabilities): void {

    }


    async initialize(): Promise<void> {

    }

    getExtension() {
        return null;
    }
}

export class HoverFeature extends DefaultCodeMirrorFeature {
    initialize(capabilities: ServerCapabilities<any>): void {
        throw new Error("Method not implemented.");
    }
    fillClientCapabilities(capabilities: ClientCapabilities): void {
        throw new Error("Method not implemented.");
    }
    method: string = 'textDocument/'
}

function posToOffset(doc: Text, pos: { line: number; character: number }) {
    if (pos.line >= doc.lines) return;

    const offset = doc.line(pos.line + 1).from + pos.character;

    if (offset > doc.length) return;

    return offset;
}
