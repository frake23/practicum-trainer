import { toSocket, createWebSocketConnection } from 'vscode-ws-jsonrpc';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { bindLanguageClient } from '@codingame/languageserver-mutualized';
import { LanguageClientsPool } from './pool.js';
import { Config } from './config.js';

console.log(Config);

const languageClientsPool = new LanguageClientsPool(
    Config.LANGUAGE_CLIENTS_NUMBER,
);

const forwardWsToProcess = async (ws: WebSocket) => {
    const socket = toSocket(ws);
    const wsConnection = createWebSocketConnection(socket, null as any);
    socket.onClose(() => wsConnection.dispose());

    await bindLanguageClient(languageClientsPool.nextClient, wsConnection);
};

const main = () => {
    const server = createServer();

    server.listen(8080, () => {
        console.log(`${Config.LANGUAGE} language server started`);
    });

    const wss = new WebSocketServer({ noServer: true });
    wss.on('connection', async (ws: WebSocket) => {
        await forwardWsToProcess(ws);
    });

    wss.on('close', () => console.log('CLOSED'));

    server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });
};

main();
