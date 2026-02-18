/**
 * Multi-user AR room client via Socket.io.
 * @module ar/collaboration/ARRoom
 */

import { logger } from '@/lib/logger';

export type SocketLike = {
  emit(event: string, ...args: unknown[]): void;
  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback?: (...args: unknown[]) => void): void;
  connected: boolean;
};

export interface ARRoomParticipant {
  id: string;
  name?: string;
  joinedAt: number;
}

export type ParticipantJoinedCallback = (participant: ARRoomParticipant) => void;
export type ParticipantLeftCallback = (participantId: string) => void;

/**
 * AR room client: join/leave and participant events.
 */
export class ARRoom {
  private socket: SocketLike | null = null;
  private roomId: string | null = null;
  private onParticipantJoinedCallback: ParticipantJoinedCallback | null = null;
  private onParticipantLeftCallback: ParticipantLeftCallback | null = null;
  private boundJoined: ((data: ARRoomParticipant) => void) | null = null;
  private boundLeft: ((data: { id: string }) => void) | null = null;

  /**
   * Join an AR room. Pass a Socket.io client and optional auth token.
   */
  async join(roomId: string, token?: string): Promise<void> {
    if (this.socket && this.roomId) this.leave();
    // Caller is responsible for providing the socket (e.g. from socket.io-client)
    logger.info('ARRoom: join (use setSocket after connecting)', { roomId });
    this.roomId = roomId;
    if (token) {
      // Token typically sent at connection or with join event
    }
  }

  /**
   * Set the Socket.io client (after connecting). Register room join and listeners.
   */
  setSocket(socket: SocketLike): void {
    this.socket = socket;
    this.boundJoined = (data: ARRoomParticipant) => this.onParticipantJoinedCallback?.(data);
    this.boundLeft = (data: { id: string }) => this.onParticipantLeftCallback?.(data.id);
    socket.on('ar:participant_joined', this.boundJoined as (...args: unknown[]) => void);
    socket.on('ar:participant_left', this.boundLeft as (...args: unknown[]) => void);
    if (this.roomId) socket.emit('ar:room_join', { roomId: this.roomId });
  }

  /**
   * Leave the current room and disconnect.
   */
  leave(): void {
    if (this.socket && this.roomId) {
      this.socket.emit('ar:room_leave', { roomId: this.roomId });
      if (this.boundJoined) this.socket.off('ar:participant_joined', this.boundJoined as (...args: unknown[]) => void);
      if (this.boundLeft) this.socket.off('ar:participant_left', this.boundLeft as (...args: unknown[]) => void);
    }
    this.socket = null;
    this.roomId = null;
    this.boundJoined = null;
    this.boundLeft = null;
    logger.debug('ARRoom: leave');
  }

  onParticipantJoined(callback: ParticipantJoinedCallback): void {
    this.onParticipantJoinedCallback = callback;
  }

  onParticipantLeft(callback: ParticipantLeftCallback): void {
    this.onParticipantLeftCallback = callback;
  }

  getRoomId(): string | null {
    return this.roomId;
  }

  dispose(): void {
    this.leave();
  }
}
