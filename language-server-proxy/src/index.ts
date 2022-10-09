import { toSocket } from 'vscode-ws-jsonrpc';
import * as rpcServer from 'vscode-ws-jsonrpc/server';
import { WebSocketServer } from 'ws';
import { CreateProcessArgs } from './types.js';
import { getLanguageServers } from './config.js';
import { createServer } from 'http';
import { parse } from 'url';

const forwardWsToProcess = (ws: WebSocket, createProcessArgs: CreateProcessArgs) => {
    const socket = toSocket(ws);
    const socketConnection = rpcServer.createWebSocketConnection(socket);
    const serverConnection = rpcServer.createServerProcess(...createProcessArgs);

    if (serverConnection) {
        rpcServer.forward(socketConnection, serverConnection, (message) => {
            console.log(`Request with message `, message);

            return message;
        });
    };
};

const main = () => {
    const server = createServer();

    const languageServers = getLanguageServers('language-servers.json');

    const websocketServers = languageServers.map(args => {
        const wss = new WebSocketServer({
            noServer: true,
        });

        wss.on('connection', (ws: WebSocket) => {
            forwardWsToProcess(ws, args)
        })

        return wss;
    });

    server.on("upgrade", (request, socket, head) => {
        const { pathname } = parse(request.url!);

        let found = false;
        websocketServers.forEach((wss, index) => {
            if (pathname?.slice(1) == languageServers[index][0]) {
                wss.handleUpgrade(request, socket, head, (ws) => {
                    wss.emit('connection', ws, request);
                });
                found = true;
            }
        });

        if (!found) {
            socket.destroy();
        }
    });

    server.listen(8080, () => {
        console.log(`Server started on port ${8080}`)
    });
};

main();
