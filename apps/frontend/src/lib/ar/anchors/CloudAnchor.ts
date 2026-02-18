/**
 * Multi-user cloud anchors via Socket.io: share and resolve anchors.
 * @module ar/anchors/CloudAnchor
 */

import { logger } from '@/lib/logger';

export interface CloudAnchorData {
  id: string;
  roomId: string;
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
  userId?: string;
  createdAt: number;
}

export type SocketLike = {
  emit(event: string, ...args: unknown[]): void;
  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback?: (...args: unknown[]) => void): void;
};

/**
 * Share anchors with other users in a room and receive remote anchors.
 */
export class CloudAnchor {
  private socket: SocketLike | null = null;
  private onReceivedCallback: ((data: CloudAnchorData) => void) | null = null;

  /**
   * Set the Socket.io (or compatible) client. Call after joining a room.
   */
  setSocket(socket: SocketLike): void {
    this.socket = socket;
    this.socket.on('ar:anchor', ((data: CloudAnchorData) => {
      this.onReceivedCallback?.(data);
    }) as (...args: unknown[]) => void);
  }

  /**
   * Share an anchor with other users in the room.
   */
  share(anchor: CloudAnchorData, roomId: string): void {
    if (!this.socket) {
      logger.warn('CloudAnchor: share called without socket');
      return;
    }
    this.socket.emit('ar:anchor', { ...anchor, roomId });
  }

  /**
   * Register callback when an anchor is received from another user.
   */
  onReceived(callback: (data: CloudAnchorData) => void): void {
    this.onReceivedCallback = callback;
  }

  /**
   * Recreate anchor representation from remote data (e.g. create Three.js object at position).
   */
  resolve(anchorData: CloudAnchorData): { position: DOMPoint; orientation: DOMPoint } {
    const position = new DOMPoint(
      anchorData.position.x,
      anchorData.position.y,
      anchorData.position.z
    );
    const orientation = new DOMPoint(
      anchorData.orientation.x,
      anchorData.orientation.y,
      anchorData.orientation.z,
      anchorData.orientation.w
    );
    return { position, orientation };
  }

  dispose(): void {
    this.socket = null;
    this.onReceivedCallback = null;
  }
}
