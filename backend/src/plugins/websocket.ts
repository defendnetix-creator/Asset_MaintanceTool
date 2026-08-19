// backend/src/plugins/websocket.ts
// WebSocket plugin for real-time scanner/agent sync

import { FastifyPluginAsync } from 'fastify';
import { jwtVerify } from 'jose';
import { WebSocket } from 'ws';

interface ScannerMessage {
  type: 'scan' | 'ping';
  data?: {
    assetTag: string;
    locationId: string;
    status?: string;
    notes?: string;
    photoBase64?: string;
  };
}

interface AgentMessage {
  type: 'heartbeat' | 'data_sync' | 'command_result';
  data?: any;
}

interface ScanData {
  assetTag: string;
  locationId: string;
  status?: string;
  notes?: string;
  photoBase64?: string;
}

interface WebSocketConnection {
  socket: WebSocket;
}

const scannerConnections = new Map<string, Set<WebSocket>>();
const agentConnections = new Map<string, WebSocket>();

export const websocketPlugin: FastifyPluginAsync = async (app) => {
  await app.register(import('@fastify/websocket'));

  // Scanner WebSocket (mobile PWA)
  app.get('/ws/scanner', { websocket: true }, async (connection: WebSocketConnection, request) => {
    const token = (request.query as Record<string, string | undefined>)?.token;
    if (!token) return connection.socket.close(4001, 'Missing token');

    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_PUBLIC_KEY!));
      const wsUser = { userId: payload.userId as string, tenantId: payload.tenantId as string, role: payload.role as string };
      
      // Register scanner connection
      if (!scannerConnections.has(wsUser.tenantId)) {
        scannerConnections.set(wsUser.tenantId, new Set());
      }
      scannerConnections.get(wsUser.tenantId)!.add(connection.socket);

      connection.socket.on('message', async (data: WebSocket.Data) => {
        try {
          const message: ScannerMessage = JSON.parse(data.toString());
          if (message.type === 'scan') {
            await handleScan(wsUser, message.data!, connection.socket);
          } else if (message.type === 'ping') {
            connection.socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          }
        } catch (err) {
          connection.socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      connection.socket.on('close', () => {
        scannerConnections.get(wsUser.tenantId)?.delete(connection.socket);
      });
    } catch {
      return connection.socket.close(4001, 'Invalid token');
    }
  });

  // Agent WebSocket (endpoint agents)
  app.get('/ws/agent', { websocket: true }, async (connection: WebSocketConnection, request) => {
    const agentToken = request.headers['x-agent-token'] as string | undefined;
    if (!agentToken) return connection.socket.close(4001, 'Missing agent token');

    const enrollment = await validateAgentToken(app, agentToken);
    if (!enrollment) return connection.socket.close(4001, 'Invalid agent token');

    agentConnections.set(enrollment.id, connection.socket);

    connection.socket.on('message', async (data: WebSocket.Data) => {
      try {
        const message: AgentMessage = JSON.parse(data.toString());
        await handleAgentMessage(app, enrollment, message, connection.socket);
      } catch (err) {
        connection.socket.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
      }
    });

    connection.socket.on('close', () => {
      agentConnections.delete(enrollment.id);
    });
  });

  // Helper functions
  async function handleScan(user: { userId: string; tenantId: string; role: string }, scanData: ScanData | undefined, socket: WebSocket) {
    if (!scanData) return;
    const { assetTag, locationId, status, notes, photoBase64 } = scanData;

    // Process scan via audit sync queue
    await app.queues.auditSync.add('scan', {
      userId: user.userId,
      tenantId: user.tenantId,
      assetTag,
      locationId,
      status: status || 'FOUND',
      notes,
      photoBase64,
      timestamp: Date.now(),
    });

    // Acknowledge
    socket.send(JSON.stringify({ type: 'scan_ack', assetTag, status: 'accepted' }));
  }

  async function handleAgentMessage(app: any, enrollment: any, message: AgentMessage, socket: WebSocket) {
    switch (message.type) {
      case 'heartbeat':
        await app.prisma.agentEnrollment.update({
          where: { id: enrollment.id },
          data: { last_seen: new Date() },
        });
        socket.send(JSON.stringify({ type: 'heartbeat_ack', timestamp: Date.now() }));
        break;
      case 'data_sync':
        await app.queues.agentSync.add('data_sync', {
          enrollmentId: enrollment.id,
          assetId: enrollment.asset_id,
          data: message.data,
        });
        socket.send(JSON.stringify({ type: 'sync_ack', timestamp: Date.now() }));
        break;
      case 'command_result':
        break;
    }
  }

  async function validateAgentToken(app: any, token: string) {
    return app.prisma.agentEnrollment.findUnique({
      where: { enrollment_token: token },
      include: { asset: true },
    });
  }

  // Broadcast helpers
  app.decorate('broadcastToTenant', (tenantId: string, message: any) => {
    const connections = scannerConnections.get(tenantId);
    if (connections) {
      const payload = JSON.stringify(message);
      for (const ws of connections) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      }
    }
  });

  app.decorate('sendToAgent', (enrollmentId: string, message: any) => {
    const ws = agentConnections.get(enrollmentId);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });

  app.decorate('sendAgentCommand', async (enrollmentId: string, command: string, params: any) => {
    const ws = agentConnections.get(enrollmentId);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'command', command, params, timestamp: Date.now() }));
      return true;
    }
    return false;
  });
};

export default websocketPlugin;