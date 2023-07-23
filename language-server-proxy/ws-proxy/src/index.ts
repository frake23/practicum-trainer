import { toSocket } from 'vscode-ws-jsonrpc';
import * as rpcServer from 'vscode-ws-jsonrpc/server';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import 'dotenv/config';

const forwardWsToProcess = (
  ws: WebSocket,
  createProcessArgs: Parameters<typeof rpcServer.createServerProcess>
) => {
  const socket = toSocket(ws);
  const socketConnection = rpcServer.createWebSocketConnection(socket);
  const serverConnection = rpcServer.createServerProcess(...createProcessArgs);

  if (serverConnection) {
    rpcServer.forward(socketConnection, serverConnection, (message) => {
      console.log(`Request with message `, message);

      return message;
    });
  }
};

const main = () => {
  const server = createServer();

  const wss = new WebSocketServer({
    noServer: true,
  });

  wss.on('connection', (ws: WebSocket) => {
    forwardWsToProcess(ws, [
      process.env.LANGUAGE as string,
      process.env.PROC_COMMAND as string,
    ]);
  });

  wss.on('close', () => console.log('CLOSED'));

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  server.listen(8080, () => {
    console.log(`Server started on port ${8080}`);
  });
};

main();
