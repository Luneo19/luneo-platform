import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface ConversationRealtimeEvent {
  conversationId: string;
  type: 'message' | 'typing' | 'crawl_progress' | 'notification' | 'metric';
  payload: Record<string, unknown>;
  emittedAt: string;
}

@Injectable()
export class ConversationsGateway {
  private readonly logger = new Logger(ConversationsGateway.name);
  private readonly roomSubscribers = new Map<string, Set<string>>();

  constructor(private readonly events: EventEmitter2) {}

  joinRoom(connectionId: string, conversationId: string) {
    const room = this.roomSubscribers.get(conversationId) ?? new Set<string>();
    room.add(connectionId);
    this.roomSubscribers.set(conversationId, room);
    this.logger.debug(`Connection ${connectionId} joined room ${conversationId}`);
  }

  leaveRoom(connectionId: string, conversationId: string) {
    const room = this.roomSubscribers.get(conversationId);
    if (!room) return;
    room.delete(connectionId);
    if (room.size === 0) {
      this.roomSubscribers.delete(conversationId);
    } else {
      this.roomSubscribers.set(conversationId, room);
    }
  }

  emitConversationEvent(
    conversationId: string,
    type: ConversationRealtimeEvent['type'],
    payload: Record<string, unknown>,
  ) {
    const event: ConversationRealtimeEvent = {
      conversationId,
      type,
      payload,
      emittedAt: new Date().toISOString(),
    };
    this.events.emit(`conversations.${conversationId}`, event);
    this.events.emit('conversations.broadcast', event);
  }

  getPresence(conversationId: string) {
    return {
      conversationId,
      onlineCount: this.roomSubscribers.get(conversationId)?.size ?? 0,
    };
  }
}
