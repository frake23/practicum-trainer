import { EditorView, ViewPlugin } from "@codemirror/view";
import Client, {
  RequestManager,
  WebSocketTransport,
} from "@open-rpc/client-js";
import { IJSONRPCNotification } from "@open-rpc/client-js/build/Request";
import {
  PublishDiagnosticsFeature,
  DidChangeTextDocumentFeature,
  DidOpenTextDocumentFeature,
  IFeature,
  HoverFeature,
  CompletionFeature,
} from "./features";
import { CodeMirrorLanguageServerPlugin } from "./plugin";
import { Transport } from "@open-rpc/client-js/build/transports/Transport";
import {
  ClientCapabilities,
  InitializedParams,
  InitializeParams,
  InitializeResult,
  WorkspaceFolder,
} from "vscode-languageserver-protocol";

export interface BaseLanguageClientOptions {
  transport?: Transport;
  serverUri?: string;
  documentUri: string;
  languageId: string;
  workspaceFolders?: WorkspaceFolder[];
}

export abstract class BaseLanguageClient {
  private _options: BaseLanguageClientOptions;

  private _rpcClient: Client;
  public documentUri: string;
  public languageId: string;

  protected _features: IFeature[] = [];

  private readonly _transport: Transport;
  private _notificationHandlers: Record<string, (params: any) => void> = {};
  private _docVersion: number = 0;

  protected constructor(options: BaseLanguageClientOptions) {
    this._options = { ...options };

    this.languageId = options.languageId;

    if (options.transport != null) {
      this._transport = options.transport;
    } else if (options.serverUri) {
      this._transport = new WebSocketTransport(
        options.serverUri + "/" + this.languageId
      );
    } else {
      throw Error();
    }

    this.documentUri = options.documentUri;

    this.registerFeatures();
  }

  public get options() {
    return this._options;
  }

  public get docVersion() {
    return this._docVersion++;
  }

  public async sendNotification<T extends object = any>(
    method: string,
    params: T
  ): Promise<void> {
    return this._rpcClient?.notify({
      method,
      params,
    });
  }

  public async makeRequest<T extends object = any, R = any>(
    method: string,
    params: T,
    timeout?: number
  ): Promise<R> {
    return await (this._rpcClient?.request(
      {
        method,
        params,
      },
      timeout
    ) as Promise<R>);
  }

  private _onNotification(data: IJSONRPCNotification): void {
    const handler = this._notificationHandlers[data.method];

    if (handler) handler(data.params);
  }

  public onNotification<T extends object = any>(
    method: string,
    handler: (params: T) => void
  ): void {
    this._notificationHandlers[method] = handler;
  }

  public registerFeature(feature: IFeature): void {
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
      workspaceFolders: this._options.workspaceFolders,
      locale: "ru-RU",
    };

    const result = await this.makeRequest<InitializeParams, InitializeResult>(
      "initialize",
      initializeParams
    );

    await this.sendNotification<InitializedParams>("initialized", {});

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

export class CodeMirrorLanguageClient extends BaseLanguageClient {
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
    this.registerFeature(new CompletionFeature(this));
  }

  public definePluginWithExtensions(): ViewPlugin<CodeMirrorLanguageServerPlugin> {
    return ViewPlugin.define((view: EditorView) => {
      this._plugin = new CodeMirrorLanguageServerPlugin(view);
      this._plugin.setOnDestroy(this.shutdown.bind(this));

      this.initialize();

      return this._plugin;
    });
  }
}
