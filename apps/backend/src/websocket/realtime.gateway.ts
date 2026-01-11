/**
 * ★★★ WEBSOCKET GATEWAY - REAL-TIME ★★★
 * Gateway WebSocket pour la collaboration temps réel
 * - Gestion connexions
 * - Rooms de collaboration
 * - Cursors partagés
 * - Commentaires en direct
 * - Présence utilisateurs
 */

// Optional: WebSocket support (install with: npm install @nestjs/websockets socket.io)
let WebSocketGateway: any, WebSocketServer: any, SubscribeMessage: any;
let OnGatewayConnection: any, OnGatewayDisconnect: any, MessageBody: any, ConnectedSocket: any;
let Server: any, Socket: any;

try {
  const websockets = require('@nestjs/websockets');
  WebSocketGateway = websockets.WebSocketGateway;
  WebSocketServer = websockets.WebSocketServer;
  SubscribeMessage = websockets.SubscribeMessage;
  OnGatewayConnection = websockets.OnGatewayConnection;
  OnGatewayDisconnect = websockets.OnGatewayDisconnect;
  MessageBody = websockets.MessageBody;
  ConnectedSocket = websockets.ConnectedSocket;
  
  const socketio = require('socket.io');
  Server = socketio.Server;
  Socket = socketio.Socket;
} catch (e) {
  // WebSocket packages not installed
}

import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/libs/prisma/prisma.service';

const logger = new Logger('RealtimeGateway');

interface AuthenticatedSocket {
  id: string;
  userId?: string;
  brandId?: string;
  userName?: string;
  handshake?: any;
  disconnect?: () => void;
  emit?: (event: string, data: any) => void;
  join?: (room: string) => void;
  leave?: (room: string) => void;
  to?: (room: string) => any;
}

interface CollaborationRoom {
  id: string;
  type: 'design' | 'product' | 'order';
  resourceId: string;
  participants: Map<string, any>;
  cursors: Map<string, any>;
  comments: any[];
}

// ========================================
// GATEWAY
// ========================================

// Only decorate if WebSocket packages are available
let GatewayDecorator: any = (target: any) => target;
let ServerDecorator: any = () => {};

if (WebSocketGateway) {
  GatewayDecorator = WebSocketGateway({
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    namespace: '/realtime',
  });
  if (WebSocketServer) {
    ServerDecorator = WebSocketServer();
  }
}

@GatewayDecorator
export class RealtimeGateway {
  @ServerDecorator
  server: any;

  private rooms: Map<string, CollaborationRoom> = new Map();
  private connections: Map<string, AuthenticatedSocket> = new Map();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService
  ) {}

  // ========================================
  // CONNECTION
  // ========================================

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from query or auth header
      const token =
        client.handshake.query.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        logger.warn('Connection rejected: No token');
        client.disconnect();
        return;
      }

      // Verify token
      const payload = this.jwtService.verify(token as string);
      client.userId = payload.sub || payload.userId;
      client.brandId = payload.brandId;

      // Get user info
      const user = await this.prisma.user.findUnique({
        where: { id: client.userId },
        select: { firstName: true, lastName: true, email: true, avatar: true },
      });

      client.userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown';

      this.connections.set(client.id, client);

      // Send connection ID
      client.emit('connection-id', { id: client.id });

      logger.log('Client connected', {
        socketId: client.id,
        userId: client.userId,
        brandId: client.brandId,
      });
    } catch (error: any) {
      logger.error('Connection error', { error });
      client.disconnect();
    }
  }

  handleDisconnect = async (client: any) => {
    logger.log('Client disconnected', {
      socketId: client.id,
      userId: client.userId,
    });

    // Remove from all rooms
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.participants.has(client.id)) {
        this.handleLeaveRoom(client, { roomId });
      }
    }

    this.connections.delete(client.id);
  }

  // ========================================
  // ROOMS
  // ========================================

  @(SubscribeMessage ? SubscribeMessage('join-room') : () => {})
  async handleJoinRoom(
    @(ConnectedSocket ? ConnectedSocket() : () => {}) client: any,
    @MessageBody() data: { roomId: string; type: string; resourceId: string }
  ) {
    const { roomId, type, resourceId } = data;

    // Leave previous rooms
    for (const [id, room] of this.rooms.entries()) {
      if (room.participants.has(client.id) && id !== roomId) {
        this.handleLeaveRoom(client, { roomId: id });
      }
    }

    // Get or create room
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        type: type as any,
        resourceId,
        participants: new Map(),
        cursors: new Map(),
        comments: [],
      };
      this.rooms.set(roomId, room);
    }

    // Add participant
    room.participants.set(client.id, client);

    // Notify client
    client.emit('room-joined', {
      roomId,
      type,
      resourceId,
      participants: Array.from(room.participants.values()).map((p: any) => ({
        id: p.userId,
        name: p.userName,
        avatar: null,
      })),
      cursors: Array.from(room.cursors.values()),
      comments: room.comments,
    });

    // Notify others
    this.server.to(roomId).emit('user-joined', {
      roomId,
      user: {
        id: client.userId,
        name: client.userName,
        avatar: null,
      },
    });

    // Join socket room
    client.join(roomId);

    logger.log('User joined room', {
      userId: client.userId,
      roomId,
      participants: room.participants.size,
    });
  }

  @(SubscribeMessage ? SubscribeMessage('leave-room') : () => {})
  async handleLeaveRoom(
    @(ConnectedSocket ? ConnectedSocket() : () => {}) client: any,
    @MessageBody() data: { roomId: string }
  ) {
    const { roomId } = data;
    const room = this.rooms.get(roomId);

    if (!room) {
      return;
    }

    // Remove participant
    const clientId = (client as any).id;
    if (clientId) {
      room.participants.delete(clientId);
      room.cursors.delete(clientId);
    }

    // Leave socket room
    client.leave(roomId);

    // Notify others
    this.server.to(roomId).emit('user-left', {
      roomId,
      userId: client.userId,
    });

    // Cleanup empty room
    if (room.participants.size === 0) {
      this.rooms.delete(roomId);
    }

    logger.log('User left room', {
      userId: client.userId,
      roomId,
    });
  }

  // ========================================
  // CURSORS
  // ========================================

  @(SubscribeMessage ? SubscribeMessage('cursor-move') : () => {})
  async handleCursorMove(
    @(ConnectedSocket ? ConnectedSocket() : () => {}) client: any,
    @MessageBody() data: { roomId: string; position: { x: number; y: number } }
  ) {
    const { roomId, position } = data;
    const room = this.rooms.get(roomId);

    if (!room || !client.userId) {
      return;
    }

    // Update cursor
    const cursor = {
      id: `cursor-${client.userId}`,
      userId: client.userId,
      userName: client.userName || 'Unknown',
      position,
      color: this.getUserColor(client.userId),
    };

    const clientId = (client as any).id;
    if (clientId) {
      room.cursors.set(clientId, cursor);
    }

    // Broadcast to others in room
    this.server.to(roomId).emit('cursor-moved', {
      roomId,
      cursorId: cursor.id,
      cursor,
    });
  }

  // ========================================
  // COMMENTS
  // ========================================

  @(SubscribeMessage ? SubscribeMessage('comment-add') : () => {})
  async handleCommentAdd(
    @(ConnectedSocket ? ConnectedSocket() : () => {}) client: any,
    @MessageBody()
    data: {
      roomId: string;
      content: string;
      position?: { x: number; y: number };
    }
  ) {
    const { roomId, content, position } = data;
    const room = this.rooms.get(roomId);

    if (!room || !client.userId) {
      return;
    }

    const comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: client.userId,
      userName: client.userName || 'Unknown',
      content,
      position,
      createdAt: new Date(),
    };

    room.comments.push(comment);

    // Broadcast to all in room (including sender)
    this.server.to(roomId).emit('comment-added', {
      roomId,
      comment,
    });

    logger.log('Comment added', {
      userId: client.userId,
      roomId,
      commentId: comment.id,
    });
  }

  @(SubscribeMessage ? SubscribeMessage('comment-update') : () => {})
  async handleCommentUpdate(
    @(ConnectedSocket ? ConnectedSocket() : () => {}) client: any,
    @MessageBody()
    data: { roomId: string; commentId: string; content: string }
  ) {
    const { roomId, commentId, content } = data;
    const room = this.rooms.get(roomId);

    if (!room || !client.userId) {
      return;
    }

    const comment = room.comments.find((c) => c.id === commentId);
    if (!comment || comment.userId !== client.userId) {
      return;
    }

    comment.content = content;

    // Broadcast to all in room
    this.server.to(roomId).emit('comment-updated', {
      roomId,
      commentId,
      comment,
    });
  }

  @(SubscribeMessage ? SubscribeMessage('comment-delete') : () => {})
  async handleCommentDelete(
    @(ConnectedSocket ? ConnectedSocket() : () => {}) client: any,
    @MessageBody() data: { roomId: string; commentId: string }
  ) {
    const { roomId, commentId } = data;
    const room = this.rooms.get(roomId);

    if (!room || !client.userId) {
      return;
    }

    const comment = room.comments.find((c) => c.id === commentId);
    if (!comment || comment.userId !== client.userId) {
      return;
    }

    room.comments = room.comments.filter((c) => c.id !== commentId);

    // Broadcast to all in room
    this.server.to(roomId).emit('comment-deleted', {
      roomId,
      commentId,
    });
  }

  // ========================================
  // UTILS
  // ========================================

  /**
   * Génère une couleur pour un utilisateur
   */
  private getUserColor(userId: string): string {
    const colors = [
      '#3B82F6',
      '#10B981',
      '#F59E0B',
      '#EF4444',
      '#8B5CF6',
      '#EC4899',
    ];
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }
}

