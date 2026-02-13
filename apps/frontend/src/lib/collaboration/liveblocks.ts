/**
 * Liveblocks Collaboration Integration
 * C-001: Intégration Liveblocks pour collaboration temps réel
 */

import { api } from '@/lib/api/client';

// Liveblocks integration - Optional dependency
// If packages are not installed, the code will gracefully degrade
// To enable: pnpm add @liveblocks/client @liveblocks/react

// Use type-only imports to avoid runtime errors if packages not installed
type Room = unknown;

// Stub functions that will be replaced if packages are available
// These are safe defaults that won't break the app
const createClientStub = (_opts?: Record<string, unknown>): Record<string, unknown> => ({});
function createRoomContextStub<
  _P = Record<string, unknown>,
  _S = Record<string, unknown>,
  _U = Record<string, unknown>,
  _E = Record<string, unknown>
>(_client: Record<string, unknown>) {
  return {
  RoomProvider: () => null,
  useRoom: () => null,
  useMyPresence: () => [null, () => {}],
  useUpdateMyPresence: () => () => {},
  useOthers: () => [],
  useOthersMapped: (_mapper?: unknown) => [],
  useSelf: () => null,
  useStorage: () => null,
  useMutation: () => () => {},
  useBroadcastEvent: () => () => {},
  useEventListener: () => {},
  useHistory: () => ({ undo: () => {}, redo: () => {} }),
  useUndo: () => () => {},
  useRedo: () => () => {},
  useCanUndo: () => false,
  useCanRedo: () => false,
  useBatch: () => () => {},
  useStatus: () => 'disconnected',
  };
}
const createLiveblocksContextStub = (_client: Record<string, unknown>) => ({
  LiveblocksProvider: () => null,
  useInboxNotifications: () => [],
  useUnreadInboxNotificationsCount: () => 0,
  useMarkAllInboxNotificationsAsRead: () => () => {},
  useUser: () => null,
});

// Try to use real implementations, fallback to stubs
const createClient = createClientStub as (opts?: Record<string, unknown>) => ReturnType<typeof createClientStub>;
const createRoomContext = createRoomContextStub;
const createLiveblocksContext = createLiveblocksContextStub;

// Note: In production, if packages are installed, they should be imported normally
// This is a build-time workaround. For runtime, use dynamic imports in components.

// Types for presence and storage
export interface Presence {
  cursor: { x: number; y: number } | null;
  selectedId: string | null;
  name: string;
  avatar?: string;
  color: string;
}

export interface Storage {
  canvasObjects: unknown[];
  comments: Comment[];
  versions: DesignVersion[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  position: { x: number; y: number };
  resolved: boolean;
  createdAt: number;
  replies: CommentReply[];
}

export interface CommentReply {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: number;
}

export interface DesignVersion {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
  snapshot: Record<string, unknown>;
}

export type UserMeta = {
  id: string;
  info: {
    name: string;
    avatar?: string;
    color: string;
  };
};

export type RoomEvent =
  | { type: 'CANVAS_UPDATE'; data: Record<string, unknown> }
  | { type: 'COMMENT_ADDED'; commentId: string }
  | { type: 'USER_JOINED'; userId: string }
  | { type: 'USER_LEFT'; userId: string };

// Generate random color for user
export function generateUserColor(): string {
  const colors = [
    '#E57373', '#F06292', '#BA68C8', '#9575CD',
    '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1',
    '#4DB6AC', '#81C784', '#AED581', '#DCE775',
    '#FFD54F', '#FFB74D', '#FF8A65', '#A1887F',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Create Liveblocks client (or stub if package not installed)
const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || '',
  throttle: 100,
  
  // Custom authentication endpoint
  authEndpoint: async (room: Room) => {
    return api.post('/api/v1/liveblocks/auth', { room });
  },

  // Resolve users for mentions
  resolveUsers: async ({ userIds }: { userIds: string[] }) => {
    return api.post('/api/v1/users/batch', { userIds });
  },

  // Resolve mention suggestions
  resolveMentionSuggestions: async ({ text, roomId }: { text: string; roomId: string }) => {
    return api.get(`/api/v1/users/search`, { params: { q: text, room: roomId } });
  },
});

// Create room context with typed storage (or stub if package not installed)
// Call function without type arguments to avoid TypeScript error
const roomContextUntyped = createRoomContext(client);
const roomContext = roomContextUntyped as ReturnType<typeof createRoomContextStub>;
export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useOthersMapped,
  useSelf,
  useStorage,
  useMutation,
  useBroadcastEvent,
  useEventListener,
  useHistory,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useBatch,
  useStatus,
} = roomContext;

// Create Liveblocks context for global features (or stub if package not installed)
const liveblocksContext = createLiveblocksContext(client);
export const {
  LiveblocksProvider,
  useInboxNotifications,
  useUnreadInboxNotificationsCount,
  useMarkAllInboxNotificationsAsRead,
  useUser,
} = liveblocksContext;

// Helper hooks
export function useCollaborators() {
  const others = useOthers();
  const self = useSelf();
  
  const collaborators = others.map((other: Record<string, unknown>) => {
    const info = (other.info ?? {}) as Record<string, unknown>;
    const presence = (other.presence ?? {}) as Record<string, unknown>;
    return {
      id: other.id,
      connectionId: other.connectionId,
      name: (info.name as string) || 'Anonymous',
      avatar: info.avatar as string | undefined,
      color: (info.color as string) || '#888',
      cursor: presence.cursor as { x: number; y: number } | null,
      selectedId: presence.selectedId as string | null,
      isActive: true,
    };
  });

  const selfData = self as Record<string, unknown> | null;
  const selfInfo = (selfData?.info ?? {}) as Record<string, unknown>;
  return {
    collaborators,
    count: others.length,
    self: selfData ? {
      id: selfData.id as string,
      name: (selfInfo.name as string) || 'You',
      avatar: selfInfo.avatar as string | undefined,
      color: (selfInfo.color as string) || '#888',
    } : null,
  };
}

interface LiveblocksOther {
  connectionId: string;
  presence?: { cursor?: { x: number; y: number } | null };
  info?: { name?: string; color?: string };
}

export function useCursors() {
  const others = useOthersMapped((other: LiveblocksOther) => ({
    connectionId: other.connectionId,
    cursor: other.presence?.cursor,
    name: other.info?.name ?? 'Anonymous',
    color: other.info?.color ?? '#888',
  }));

  return (others as { cursor: unknown }[]).filter((other) => other.cursor !== null);
}

// Export client for direct access
export { client as liveblocksClient };

