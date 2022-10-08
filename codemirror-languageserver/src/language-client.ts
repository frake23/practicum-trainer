import { EditorView, PluginValue, ViewPlugin } from "@codemirror/view";
import Client, { RequestManager, WebSocketTransport } from "@open-rpc/client-js";
import { IJSONRPCNotification } from "@open-rpc/client-js/build/Request";
import { DidOpenTextDocumentFeature, ICodeMirrorFeature, IFeature } from "./features";
import { CodeMirrorLanguageServerPlugin } from "./plugin";

export interface BaseLanguageClientOptions {
    client?: Client;
    serverUri?: string;
    rootUri: string;
    documentUri: string;
    languageId: string;
}

export abstract class BaseLanguageClient<FEATURE_TYPE extends IFeature = IFeature> {
    public features: FEATURE_TYPE[];
    public rpcClient: Client;
    public rootUri: string;
    public documentUri: string;
    public languageId: string;

    private _notificationHandlers: Record<string, (params: any) => void> = {};
    private _docVersion: number = 0;

    public get docVersion() {
        return this._docVersion++;
    }

    public sendNotification<T extends object = any>(method: string, params: T, delay?: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(
                    this.rpcClient.notify({
                        method, params
                    })
                );
            }, delay);
        });
    }

    public makeRequest<T extends object = any, R = any>(method: string, params: T, timeout?: number): Promise<R> {
        return this.rpcClient.request({
            method, params
        }, timeout) as Promise<R>;
    }

    private _onNotification(data: IJSONRPCNotification): void {
        const handler = this._notificationHandlers[data.method];

        if (handler) handler(data.params);
    }

    public setNotificationHandler<T extends object = any>(method: string, handler: (params: T) => void): void {
        this._notificationHandlers[method] = handler;
    }

    constructor(options: BaseLanguageClientOptions) {
        if (options.client) {
            this.rpcClient = options.client;
        } else if (options.serverUri) {
            const transport = new WebSocketTransport(options.serverUri);
            const client = new Client(new RequestManager([transport]));
            this.rpcClient = client;
        } else {
            throw Error();
        }

        this.rpcClient.onNotification(this._onNotification.bind(this))
    }

    public registerFeature(feature: FEATURE_TYPE) {
        this.features.push(feature);
        feature.register();
    }

    protected abstract registerFeatures(): void;
}


export class CodeMirrorLanguageClient extends BaseLanguageClient<ICodeMirrorFeature> {
    public plugin: CodeMirrorLanguageServerPlugin | null = null;

    constructor(options: BaseLanguageClientOptions) {
        super(options);
    }

    public registerFeatures(): void {
        this.registerFeature(new DidOpenTextDocumentFeature(this));
    }

    private definePlugin(view: EditorView): PluginValue {
        this.plugin = new CodeMirrorLanguageServerPlugin(view);
        this.registerFeatures();

        return this.plugin;
    }

    public get extensions() {
        return [
            ViewPlugin.define(this.definePlugin.bind(this)),
            ...this.features
                .map(feature => feature.getExtension())
                .filter(feature => Boolean(feature))
        ];
    }
}
