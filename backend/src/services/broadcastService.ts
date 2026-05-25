import { WebSocket } from 'ws';

const wsClients = new Map<string, Set<WebSocket>>();
const clientSubscriptions = new WeakMap<WebSocket, Set<string>>();

export function registerClient(assignmentId: string, ws: WebSocket) {
  if (!wsClients.has(assignmentId)) {
    wsClients.set(assignmentId, new Set());
  }
  wsClients.get(assignmentId)!.add(ws);

  if (!clientSubscriptions.has(ws)) {
    clientSubscriptions.set(ws, new Set());
  }
  clientSubscriptions.get(ws)!.add(assignmentId);

  console.log(`Client registered for assignment: ${assignmentId}`);
}

export function unregisterClient(ws: WebSocket) {
  const subscriptions = clientSubscriptions.get(ws);
  if (subscriptions) {
    for (const assignmentId of subscriptions) {
      const clients = wsClients.get(assignmentId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
          wsClients.delete(assignmentId);
        }
      }
    }
  }
}

export function broadcast(assignmentId: string, payload: object) {
  const clients = wsClients.get(assignmentId);
  if (clients && clients.size > 0) {
    const message = JSON.stringify(payload);
    for (const client of clients) {
      if (client.readyState === 1) { // OPEN
        try {
          client.send(message);
        } catch (error) {
          console.error('Failed to send message to client:', error);
        }
      }
    }
    console.log(`Broadcast to ${clients.size} clients for assignment ${assignmentId}`);
  }
}

export function getClientsMap() {
  return wsClients;
}
