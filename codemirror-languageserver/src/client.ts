import { EditorView, PluginValue, ViewPlugin } from "@codemirror/view";
import Client, { RequestManager, WebSocketTransport } from "@open-rpc/client-js";
import * as LSP from 'vscode-languageserver-protocol';
import { IJSONRPCNotification } from "@open-rpc/client-js/build/Request";
import { PublishDiagnosticsFeature, DidChangeTextDocumentFeature, DidOpenTextDocumentFeature, ICodeMirrorFeature, IFeature } from "./features";
import { CodeMirrorLanguageServerPlugin } from "./plugin";
import { Transport } from "@open-rpc/client-js/build/transports/Transport";
import { Extension } from "@codemirror/state";

export interface BaseLanguageClientOptions {
    transport?: Transport;
    serverUri?: string;
    rootUri: string;
    documentUri: string;
    languageId: string;
}

export abstract class BaseLanguageClient<FEATURE_TYPE extends IFeature = IFeature> {
    public rpcClient: Client;
    public rootUri: string;
    public documentUri: string;
    public languageId: string;

    protected _features: FEATURE_TYPE[] = [];

    private _transport: Transport;
    private _notificationHandlers: Record<string, (params: any) => void> = {};
    private _docVersion: number = 0;

    constructor(options: BaseLanguageClientOptions) {
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

    public get docVersion() {
        return this._docVersion++;
    }

    public sendNotification<T extends object = any>(method: string, params: T, delay: number = 0): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.rpcClient?.notify({
                    method, params
                }).then(() => {
                    console.log('notification resolved')
                    resolve();
                }).catch(() => console.log('notification not resolved'))
            }, delay);
        });
    }

    public makeRequest<T extends object = any, R = any>(method: string, params: T, timeout?: number): Promise<R> {
        return this.rpcClient?.request({
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
        this.rpcClient = new Client(new RequestManager([this._transport]));

        this.rpcClient.onNotification(this._onNotification.bind(this));

        const initializeParams: LSP.InitializeParams = {
            capabilities: {
                textDocument: {
                    moniker: {},
                    synchronization: {
                        dynamicRegistration: true,
                        willSave: false,
                        didSave: false,
                        willSaveWaitUntil: false,
                    },
                    signatureHelp: {
                        dynamicRegistration: true,
                        signatureInformation: {
                            documentationFormat: ['plaintext', 'markdown'],
                        },
                    },
                    declaration: {
                        dynamicRegistration: true,
                        linkSupport: true,
                    },
                    definition: {
                        dynamicRegistration: true,
                        linkSupport: true,
                    },
                    typeDefinition: {
                        dynamicRegistration: true,
                        linkSupport: true,
                    },
                    implementation: {
                        dynamicRegistration: true,
                        linkSupport: true,
                    },
                    publishDiagnostics: {
                        relatedInformation: true,
                        versionSupport: false,
                        codeDescriptionSupport: true,
                        dataSupport: true,
                    }
                },
                workspace: {
                    didChangeConfiguration: {
                        dynamicRegistration: true,
                    },
                },
            },
            initializationOptions: null,
            processId: null,
            rootUri: this.rootUri,
        }

        const result = await this.makeRequest<LSP.InitializeParams, LSP.InitializeResult>('initialize', initializeParams);

        await this.sendNotification<LSP.InitializedParams>('initialized', {});

        for (const feature of this._features) {
            feature.initialize(result.capabilities);
        }

    }

    public shutdown(): void {
        this.rpcClient?.close();
    }

    // private _computeClientCapabilities(): LSP.ClientCapabilities {
    //     const result: LSP.ClientCapabilities = {};

    //     for (const feature of this._features) {
    //         feature.fillClientCapabilities(result);
    //     }

    //     return result;
    // }
}


export class CodeMirrorLanguageClient extends BaseLanguageClient<ICodeMirrorFeature> {
    public plugin: CodeMirrorLanguageServerPlugin | null = null;

    constructor(options: BaseLanguageClientOptions) {
        super(options);
    }

    public registerFeatures(): void {
        this.registerFeature(new DidOpenTextDocumentFeature(this));
        this.registerFeature(new DidChangeTextDocumentFeature(this));
        this.registerFeature(new PublishDiagnosticsFeature(this));
    }

    private _definePlugin(view: EditorView): PluginValue {
        this.plugin = new CodeMirrorLanguageServerPlugin(view);
        this.plugin.setOnDestroy(this.shutdown.bind(this));

        this.initialize();

        return this.plugin;
    }

    public getExtensions(): Extension[] {
        return [
            ViewPlugin.define(this._definePlugin.bind(this)),
            ...this._features
                .map(feature => feature.getExtension())
                .filter(extension => Boolean(extension)) as Extension[]
        ];
    }
}
