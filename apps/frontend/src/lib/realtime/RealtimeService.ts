/**
 * ★★★ SERVICE - REAL-TIME COLLABORATION ★★★
 * Service professionnel pour la collaboration temps réel
 * - WebSockets pour real-time
 * - Collaboration multi-utilisateurs
 * - Cursors partagés
 * - Commentaires en direct
 * - Notifications instantanées
 */

import { logger } from '@/lib/logger';
import { EventEmitter } from 'events';

// ========================================
// TYPES
// ========================================

export interface RealtimeConnection {
  id: string;
  userId: string;
  brandId?: string;
  connectedAt: Date;
}

export interface SharedCursor {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  position: { x: number; y: number };
  color: string;
}

export interface LiveComment {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  content: string;
  position?: { x: number; y: number };
  createdAt: Date;
}

export interface CollaborationRoom {
  id: string;
  type: 'design' | 'product' | 'order';
  resourceId: string;
  participants: RealtimeConnection[];
  cursors: SharedCursor[];
  comments: LiveComment[];
}

export type RealtimeEvent =
  | 'connected'
  | 'disconnected'
  | 'cursor-moved'
  | 'comment-added'
  | 'comment-updated'
  | 'comment-deleted'
  | 'user-joined'
  | 'user-left'
  | 'presence-updated';

// ========================================
// SERVICE
// ========================================

export class RealtimeService extends EventEmitter {
  private static instance: RealtimeService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private connectionId: string | null = null;
  private rooms: Map<string, CollaborationRoom> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  // ========================================
  // CONNECTION
  // ========================================

  /**
   * Connecte au serveur WebSocket
   */
  async connect(userId: string, brandId?: string): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      logger.warn('Already connected or connecting');
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      this.ws = new WebSocket(`${wsUrl}/realtime?userId=${userId}&brandId=${brandId || ''}`);

      this.ws.onopen = () => {
        logger.info('WebSocket connected', { userId, brandId });
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          logger.error('Error parsing WebSocket message', { error });
        }
      };

      this.ws.onerror = (error) => {
        logger.error('WebSocket error', { error });
        this.isConnecting = false;
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        logger.info('WebSocket disconnected');
        this.isConnecting = false;
        this.handleReconnect(userId, brandId);
      };
    } catch (error: any) {
      logger.error('Error connecting WebSocket', { error });
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Déconnecte du serveur WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionId = null;
    this.rooms.clear();
  }

  /**
   * Gère la reconnexion automatique
   */
  private handleReconnect(userId: string, brandId?: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      this.emit('reconnect-failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info('Reconnecting WebSocket', {
      attempt: this.reconnectAttempts,
      delay,
    });

    setTimeout(() => {
      this.connect(userId, brandId).catch((error) => {
        logger.error('Reconnection failed', { error });
      });
    }, delay);
  }

  // ========================================
  // MESSAGES
  // ========================================

  /**
   * Envoie un message au serveur
   */
  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      logger.warn('WebSocket not connected, cannot send message');
    }
  }

  /**
   * Gère les messages reçus
   */
  private handleMessage(data: any): void {
    const { type, payload } = data;

    switch (type) {
      case 'connection-id':
        this.connectionId = payload.id;
        break;

      case 'room-joined':
        this.handleRoomJoined(payload);
        break;

      case 'room-left':
        this.handleRoomLeft(payload);
        break;

      case 'cursor-moved':
        this.handleCursorMoved(payload);
        break;

      case 'comment-added':
        this.handleCommentAdded(payload);
        break;

      case 'comment-updated':
        this.handleCommentUpdated(payload);
        break;

      case 'comment-deleted':
        this.handleCommentDeleted(payload);
        break;

      case 'user-joined':
        this.handleUserJoined(payload);
        break;

      case 'user-left':
        this.handleUserLeft(payload);
        break;

      case 'presence-updated':
        this.handlePresenceUpdated(payload);
        break;

      default:
        logger.warn('Unknown message type', { type });
    }
  }

  // ========================================
  // ROOMS
  // ========================================

  /**
   * Rejoint une room de collaboration
   */
  joinRoom(roomId: string, type: 'design' | 'product' | 'order', resourceId: string): void {
    this.send({
      type: 'join-room',
      payload: {
        roomId,
        type,
        resourceId,
      },
    });
  }

  /**
   * Quitte une room de collaboration
   */
  leaveRoom(roomId: string): void {
    this.send({
      type: 'leave-room',
      payload: { roomId },
    });
    this.rooms.delete(roomId);
  }

  private handleRoomJoined(payload: any): void {
    const room: CollaborationRoom = {
      id: payload.roomId,
      type: payload.type,
      resourceId: payload.resourceId,
      participants: payload.participants || [],
      cursors: payload.cursors || [],
      comments: payload.comments || [],
    };
    this.rooms.set(payload.roomId, room);
    this.emit('room-joined', room);
  }

  private handleRoomLeft(payload: any): void {
    this.rooms.delete(payload.roomId);
    this.emit('room-left', payload.roomId);
  }

  // ========================================
  // CURSORS
  // ========================================

  /**
   * Met à jour la position du curseur
   */
  updateCursor(roomId: string, position: { x: number; y: number }): void {
    this.send({
      type: 'cursor-move',
      payload: {
        roomId,
        position,
      },
    });
  }

  private handleCursorMoved(payload: any): void {
    const room = this.rooms.get(payload.roomId);
    if (room) {
      const existingIndex = room.cursors.findIndex((c) => c.id === payload.cursorId);
      if (existingIndex >= 0) {
        room.cursors[existingIndex] = payload.cursor;
      } else {
        room.cursors.push(payload.cursor);
      }
      this.emit('cursor-moved', payload);
    }
  }

  // ========================================
  // COMMENTS
  // ========================================

  /**
   * Ajoute un commentaire
   */
  addComment(
    roomId: string,
    content: string,
    position?: { x: number; y: number }
  ): void {
    this.send({
      type: 'comment-add',
      payload: {
        roomId,
        content,
        position,
      },
    });
  }

  /**
   * Met à jour un commentaire
   */
  updateComment(roomId: string, commentId: string, content: string): void {
    this.send({
      type: 'comment-update',
      payload: {
        roomId,
        commentId,
        content,
      },
    });
  }

  /**
   * Supprime un commentaire
   */
  deleteComment(roomId: string, commentId: string): void {
    this.send({
      type: 'comment-delete',
      payload: {
        roomId,
        commentId,
      },
    });
  }

  private handleCommentAdded(payload: any): void {
    const room = this.rooms.get(payload.roomId);
    if (room) {
      room.comments.push(payload.comment);
      this.emit('comment-added', payload);
    }
  }

  private handleCommentUpdated(payload: any): void {
    const room = this.rooms.get(payload.roomId);
    if (room) {
      const index = room.comments.findIndex((c) => c.id === payload.commentId);
      if (index >= 0) {
        room.comments[index] = payload.comment;
        this.emit('comment-updated', payload);
      }
    }
  }

  private handleCommentDeleted(payload: any): void {
    const room = this.rooms.get(payload.roomId);
    if (room) {
      room.comments = room.comments.filter((c) => c.id !== payload.commentId);
      this.emit('comment-deleted', payload);
    }
  }

  // ========================================
  // PRESENCE
  // ========================================

  private handleUserJoined(payload: any): void {
    const room = this.rooms.get(payload.roomId);
    if (room) {
      room.participants.push(payload.user);
      this.emit('user-joined', payload);
    }
  }

  private handleUserLeft(payload: any): void {
    const room = this.rooms.get(payload.roomId);
    if (room) {
      room.participants = room.participants.filter(
        (p) => p.id !== payload.userId
      );
      room.cursors = room.cursors.filter((c) => c.userId !== payload.userId);
      this.emit('user-left', payload);
    }
  }

  private handlePresenceUpdated(payload: any): void {
    this.emit('presence-updated', payload);
  }

  // ========================================
  // GETTERS
  // ========================================

  /**
   * Récupère une room
   */
  getRoom(roomId: string): CollaborationRoom | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Vérifie si connecté
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// ========================================
// EXPORT
// ========================================

export const realtimeService = RealtimeService.getInstance();

