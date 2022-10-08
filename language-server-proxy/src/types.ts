import * as server from 'vscode-ws-jsonrpc/server';

export type LanguageServerConfig = Record<
    string,
    {
        command: string;
        args?: string[];
    }
>;

export type CreateProcessArgs = Parameters<typeof server.createServerProcess>;
