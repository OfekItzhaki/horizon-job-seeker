import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export interface AutomationUpdate {
  type:
    | 'automation_started'
    | 'automation_filling'
    | 'automation_paused'
    | 'automation_submitted'
    | 'automation_cancelled'
    | 'automation_error';
  automationId: string;
  jobId: number;
  message: string;
  timestamp: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send initial connection confirmation
      ws.send(
        JSON.stringify({
          type: 'connected',
          message: 'Connected to Job Search Agent WebSocket',
          timestamp: new Date().toISOString(),
        })
      );
    });

    console.log('WebSocket server initialized on /ws');
  }

  broadcast(update: AutomationUpdate) {
    const message = JSON.stringify(update);

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log(`Broadcasted update to ${this.clients.size} clients:`, update.type);
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const wsManager = new WebSocketManager();
