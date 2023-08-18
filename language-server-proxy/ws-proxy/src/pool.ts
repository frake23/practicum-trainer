import {
    LanguageClient,
    createLanguageClient,
} from '@codingame/languageserver-mutualized';
import { createMessageConnection } from 'vscode-jsonrpc/node.js';
import { createServerProcess } from 'vscode-ws-jsonrpc/server';
import { Config } from './config.js';

export class LanguageClientsPool {
    private _size: number;
    private _currentIndex: number = 0;
    private _pool: LanguageClient[] = [];

    constructor(size: number) {
        this._size = size;
    }

    private get _nextIndex(): number {
        this._currentIndex = (this._currentIndex + 1) % this._size;
        return this._currentIndex;
    }

    get nextClient(): LanguageClient {
        if (this._pool.length === this._size) {
            return this._pool[this._nextIndex];
        }

        const serverConnection = createServerProcess(
            Config.LANGUAGE,
            Config.PROC_COMMAND,
        );
        const languageClient = createLanguageClient(
            createMessageConnection(
                serverConnection!.reader,
                serverConnection!.writer,
            ),
        );
        languageClient.onDispose(() => {
            this._pool = this._pool.filter(
                (client) => client !== languageClient,
            );
        });
        this._pool.push(languageClient);
        return languageClient;
    }
}
