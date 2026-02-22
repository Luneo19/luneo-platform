/**
 * AR Anchors module: local, persistent, and cloud anchors.
 * @module ar/anchors
 */

export { ARAnchorManager } from './ARAnchorManager';
export type { ManagedAnchor } from './ARAnchorManager';
export { PersistentAnchor } from './PersistentAnchor';
export type { StoredAnchorData } from './PersistentAnchor';
export { CloudAnchor } from './CloudAnchor';
export type { CloudAnchorData, SocketLike } from './CloudAnchor';
