import { EditorView, ViewPlugin } from "@codemirror/view";
import Client, { RequestManager, WebSocketTransport } from "@open-rpc/client-js";
import { IJSONRPCNotification } from "@open-rpc/client-js/build/Request";
import { PublishDiagnosticsFeature, DidChangeTextDocumentFeature, DidOpenTextDocumentFeature, ICodeMirrorFeature, IFeature, HoverFeature } from "./features";
import { CodeMirrorLanguageServerPlugin } from "./plugin";
import { Transport } from "@open-rpc/client-js/build/transports/Transport";
import { StateEffect } from "@codemirror/state";
import { ClientCapabilities, InitializedParams, InitializeParams, InitializeResult } from "vscode-languageserver-protocol";

export interface BaseLanguageClientOptions {
    transport?: Transport;
    serverUri?: string;
    documentUri: string;
    languageId: string;
}

export abstract class BaseLanguageClient<FEATURE_TYPE extends IFeature = IFeature> {
    private _rpcClient: Client;
    public documentUri: string;
    public languageId: string;

    protected _features: FEATURE_TYPE[] = [];

    private _transport: Transport;
    private _notificationHandlers: Record<string, (params: any) => void> = {};
    private _docVersion: number = 0;

    public constructor(options: BaseLanguageClientOptions) {
        this.languageId = options.languageId;

        if (options.transport) {
            this._transport = options.transport;
        } else if (options.serverUri) {
            this._transport = new WebSocketTransport(options.serverUri + '/' + this.languageId);
        } else {
            throw Error();
        }

        this.documentUri = options.documentUri;

        this.registerFeatures()
    }

    public get rpcClient(): Client {
        return this._rpcClient
    }

    public get docVersion() {
        return this._docVersion++;
    }

    public sendNotification<T extends object = any>(method: string, params: T, delay: number = 0): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                this._rpcClient?.notify({
                    method, params
                }).then(() => {
                    resolve();
                })
            }, delay);
        });
    }

    public makeRequest<T extends object = any, R = any>(method: string, params: T, timeout?: number): Promise<R> {
        return this._rpcClient?.request({
            method, params
        }, timeout) as Promise<R>;
    }

    private _onNotification(data: IJSONRPCNotification): void {
        const handler = this._notificationHandlers[data.method];

        if (handler) handler(data.params);
    }

    public onNotification<T extends object = any>(method: string, handler: (params: T) => void): void {
        this._notificationHandlers[method] = handler;
    }

    public registerFeature(feature: FEATURE_TYPE) {
        this._features.push(feature);
    }

    protected abstract registerFeatures(): void;

    public async initialize(): Promise<void> {
        this._rpcClient = new Client(new RequestManager([this._transport]));

        this._rpcClient.onNotification(this._onNotification.bind(this));

        const initializeParams: InitializeParams = {
            capabilities: this._computeClientCapabilities(),
            initializationOptions: null,
            processId: null,
            rootUri: null,
            workspaceFolders: null,
            locale: "ru-RU",
        }

        const result = await this.makeRequest<InitializeParams, InitializeResult>('initialize', initializeParams);

        await this.sendNotification<InitializedParams>('initialized', {});

        for (const feature of this._features) {
            feature.initialize(result.capabilities);
        }
    }

    public shutdown(): void {
        this._rpcClient?.close();
    }

    private _computeClientCapabilities(): ClientCapabilities {
        const result: ClientCapabilities = {};

        for (const feature of this._features) {
            feature.fillClientCapabilities(result);
        }

        return result;
    }
}


export class CodeMirrorLanguageClient extends BaseLanguageClient<ICodeMirrorFeature> {
    private _plugin: CodeMirrorLanguageServerPlugin | null = null;

    public constructor(options: BaseLanguageClientOptions) {
        super(options);
    }

    public get plugin(): CodeMirrorLanguageServerPlugin | null {
        return this._plugin;
    }

    public registerFeatures(): void {
        this.registerFeature(new DidOpenTextDocumentFeature(this));
        this.registerFeature(new DidChangeTextDocumentFeature(this));
        this.registerFeature(new PublishDiagnosticsFeature(this));
        this.registerFeature(new HoverFeature(this));
    }

    public definePluginWithExtensions(): ViewPlugin<CodeMirrorLanguageServerPlugin> {
        return ViewPlugin.define((view: EditorView) => {
            this._plugin = new CodeMirrorLanguageServerPlugin(view);
            this._plugin.setOnDestroy(this.shutdown.bind(this));

            this.initialize().then(() => {
                view.dispatch({
                    effects: this._features
                        .map(feature => feature.extension)
                        .filter(extension => Boolean(extension))
                        .map(extension => {
                            return StateEffect.appendConfig.of(extension!)
                        })
                })
            });

            return this._plugin;
        });
    }
}

const a = Number(0)
