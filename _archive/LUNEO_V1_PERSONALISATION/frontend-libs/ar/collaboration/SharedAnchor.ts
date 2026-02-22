/**
 * Sync anchors between users in a shared AR session.
 * @module ar/collaboration/SharedAnchor
 */

import { logger } from '@/lib/logger';
import type { CloudAnchorData } from '../anchors/CloudAnchor';
import type { SocketLike } from './ARRoom';

/**
 * Share anchor data with other participants and receive anchors from others.
 */
export class SharedAnchor {
  private socket: SocketLike | null = null;
  private onReceivedCallback: ((data: CloudAnchorData) => void) | null = null;

  /**
   * Set Socket.io client (e.g. from ARRoom).
   */
  setSocket(socket: SocketLike): void {
    this.socket = socket;
    this.socket.on('ar:anchor', ((data: CloudAnchorData) => {
      this.onReceivedCallback?.(data);
    }) as (...args: unknown[]) => void);
  }

  /**
   * Share anchor data with others in the room.
   */
  share(anchor: CloudAnchorData): void {
    if (!this.socket) {
      logger.warn('SharedAnchor: share called without socket');
      return;
    }
    this.socket.emit('ar:anchor', anchor);
  }

  /**
   * Register callback when anchor is received from another user.
   */
  onReceived(callback: (data: CloudAnchorData) => void): void {
    this.onReceivedCallback = callback;
  }

  dispose(): void {
    this.socket = null;
    this.onReceivedCallback = null;
  }
}
