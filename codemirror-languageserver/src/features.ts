import { Extension } from "@codemirror/state";
import { setDiagnostics } from '@codemirror/lint';
import { Text } from '@codemirror/state'
import { CodeMirrorLanguageClient } from './client';
import { ClientCapabilities, DidChangeTextDocumentParams, DidOpenTextDocumentParams, Hover, HoverParams, MarkedString, MarkupContent, PublishDiagnosticsParams, ServerCapabilities } from "vscode-languageserver-protocol";
import { hoverTooltip } from "@codemirror/view";

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
    extension: Extension | null;
}

export abstract class DefaultCodeMirrorFeature implements ICodeMirrorFeature {
    protected _client: CodeMirrorLanguageClient;
    protected _extension: Extension | null = null;

    public constructor(client: CodeMirrorLanguageClient) {
        this._client = client;
    }

    public get extension(): Extension | null {
        return this._extension;
    }

    abstract initialize(capabilities: ServerCapabilities): void;

    abstract fillClientCapabilities(capabilities: ClientCapabilities): void;
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
    private _method: string = 'textDocument/didChange';

    public fillClientCapabilities(capabilities: ClientCapabilities): void {
        ensure(ensure(capabilities, 'textDocument')!, 'synchronization')!.dynamicRegistration = true;
    }

    public initialize(capabilities: ServerCapabilities): void {
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
                this._method,
                params,
                500
            )
        })
    }
}

export class PublishDiagnosticsFeature extends DefaultCodeMirrorFeature {
    private _method: string = 'textDocument/publishDiagnostics';

    public fillClientCapabilities(capabilities: ClientCapabilities): void {
        const diagnostics = ensure(ensure(capabilities, 'textDocument')!, 'publishDiagnostics')!;
        diagnostics.relatedInformation = true;
        diagnostics.versionSupport = false;
        diagnostics.tagSupport = { valueSet: [1, 2] };
        diagnostics.codeDescriptionSupport = true;
        diagnostics.dataSupport = true;
    }

    public initialize(_capabilities: ServerCapabilities): void {
        this._client.onNotification(this._method, (params: PublishDiagnosticsParams) => {
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

export class HoverFeature extends DefaultCodeMirrorFeature {
    private _method: string = 'textDocument/hover'

    public fillClientCapabilities(capabilities: ClientCapabilities): void {
        const hoverCapability = (ensure(ensure(capabilities, 'textDocument')!, 'hover')!);
        hoverCapability.dynamicRegistration = true;
        hoverCapability.contentFormat = ['markdown', 'plaintext'];
    }

    public initialize(capabilities: ServerCapabilities<any>): void {
        if (!capabilities.hoverProvider) return;

        this._extension = hoverTooltip(async (view, offset) => {
            const position = offsetToPos(view.state.doc, offset);

            const params: HoverParams = {
                textDocument: {
                    uri: this._client.documentUri,
                },
                position
            }

            const { contents, range } = await this._client.makeRequest<HoverParams, Hover>(this._method, params);

            let pos = offset;
            let end: number | undefined;

            if (range) {
                pos = posToOffset(view.state.doc, range.start)!;
                end = posToOffset(view.state.doc, range.end);
            }

            const dom = document.createElement('div');

            dom.classList.add('documentation');
            dom.textContent = formatContents(contents);

            return { pos, end, create: (view) => ({ dom }), above: true };
        });
    }
}

function posToOffset(doc: Text, pos: { line: number; character: number }) {
    if (pos.line >= doc.lines) return;

    const offset = doc.line(pos.line + 1).from + pos.character;

    if (offset > doc.length) return;

    return offset;
}

function offsetToPos(doc: Text, offset: number) {
    const line = doc.lineAt(offset);
    return {
        line: line.number - 1,
        character: offset - line.from,
    };
}

function formatContents(
    contents: MarkupContent | MarkedString | MarkedString[]
): string {
    if (Array.isArray(contents)) {
        return contents.map((c) => formatContents(c) + '\n\n').join('');
    } else if (typeof contents === 'string') {
        return contents;
    } else {
        return contents.value;
    }
}

