// backend/src/plugins/websocket.ts
// WebSocket plugin for real-time scanner/agent sync

import { FastifyPluginAsync } from 'fastify';
import { WebSocket } from 'ws';
import { jwtVerify } from 'jose';

declare module 'fastify' {
  interface FastifyRequest {
    ws?: WebSocket;
    wsUser?: { userId: string; tenantId: string; role: string };
    wsAgent?: { enrollmentId: string; assetId?: string };
  }
}

export const websocketPlugin: FastifyPluginAsync = async (app) => {
  await app.register(import('@fastify/websocket'));

  // Store active connections
  const scannerConnections = new Map<string, Set<WebSocket>>(); // tenantId -> Set<WebSocket>
  const agentConnections = new Map<string, WebSocket>(); // enrollmentId -> WebSocket

  // Scanner WebSocket (mobile PWA)
  app.get('/ws/scanner', { websocket: true }, async (connection, request) => {
    const token = request.query.token as string;
    if (!token) return connection.close(4001, 'Missing token');

    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_PUBLIC_KEY!));
      request.wsUser = { userId: payload.userId, tenantId: payload.tenantId, role: payload.role };
    } catch {
      return connection.close(4001, 'Invalid token');
    }

    // Register scanner connection
    if (!scannerConnections.has(request.wsUser.tenantId)) {
      scannerConnections.set(request.wsUser.tenantId, new Set());
    }
    scannerConnections.get(request.wsUser.tenantId)!.add(connection.socket);

    connection.socket.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'scan') {
          await handleScan(request.wsUser!, message.data, connection.socket);
        } else if (message.type === 'ping') {
          connection.socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (err) {
        connection.socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    connection.socket.on('close', () => {
      scannerConnections.get(request.wsUser!.tenantId)?.delete(connection.socket);
    });
  });

  // Agent WebSocket (endpoint agents)
  app.get('/ws/agent', { websocket: true }, async (connection, request) => {
    const agentToken = request.headers['x-agent-token'] as string;
    if (!agentToken) return connection.close(4001, 'Missing agent token');

    const enrollment = await validateAgentToken(agentToken);
    if (!enrollment) return connection.close(4001, 'Invalid agent token');

    request.wsAgent = { enrollmentId: enrollment.id, assetId: enrollment.asset_id };
    agentConnections.set(enrollment.id, connection.socket);

    connection.socket.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleAgentMessage(enrollment, message, connection.socket);
      } catch (err) {
        connection.socket.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
      }
    });

    connection.socket.on('close', () => {
      agentConnections.delete(enrollment.id);
    });
  });

  // Helper functions
  async function handleScan(user: any, scanData: any, socket: WebSocket) {
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

  async function handleAgentMessage(enrollment: any, message: any, socket: WebSocket) {
    switch (message.type) {
      case 'heartbeat':
        // Update last_seen
        await app.prisma.agentEnrollment.update({
          where: { id: enrollment.id },
          data: { last_seen: new Date() },
        });
        socket.send(JSON.stringify({ type: 'heartbeat_ack', timestamp: Date.now() }));
        break;
      case 'data_sync':
        // Process agent data (hardware, software, network, security)
        await app.queues.agentSync.add('data_sync', {
          enrollmentId: enrollment.id,
          assetId: enrollment.asset_id,
          data: message.data,
        });
        socket.send(JSON.stringify({ type: 'sync_ack', timestamp: Date.now() }));
        break;
      case 'command_result':
        // Handle command execution results
        break;
    }
  }

  async function validateAgentToken(token: string) {
    // Validate agent token from database
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
  });

  app.decorate('sendToAgent', (enrollmentId: string, message: any) => {
    const ws = agentConnections.get(enrollmentId);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });

  // Agent command helpers
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