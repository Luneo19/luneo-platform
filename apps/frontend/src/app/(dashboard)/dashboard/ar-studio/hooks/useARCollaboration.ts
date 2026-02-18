/**
 * Hook for AR collaboration room (Socket.io)
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface CollaborationParticipant {
  id: string;
  name: string;
  color?: string;
  cursor?: { x: number; y: number };
  isActive?: boolean;
}

export interface CollaborationMessage {
  id: string;
  userId: string;
  userName: string;
  type: 'chat' | 'placement' | 'cursor' | 'system';
  payload: unknown;
  timestamp: number;
}

export interface UseARCollaborationOptions {
  roomId: string | null;
  userId: string;
  userName: string;
  serverUrl?: string;
  onMessage?: (msg: CollaborationMessage) => void;
  onParticipantsChange?: (participants: CollaborationParticipant[]) => void;
}

export function useARCollaboration(options: UseARCollaborationOptions) {
  const {
    roomId,
    userId,
    userName,
    serverUrl = '',
    onMessage,
    onParticipantsChange,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<CollaborationParticipant[]>([]);
  const [messages, setMessages] = useState<CollaborationMessage[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback(
    (type: CollaborationMessage['type'], payload: unknown) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(
        JSON.stringify({
          userId,
          userName,
          type,
          payload,
          timestamp: Date.now(),
        })
      );
    },
    [userId, userName]
  );

  const sendChat = useCallback(
    (text: string) => sendMessage('chat', { text }),
    [sendMessage]
  );

  const sendPlacement = useCallback(
    (transform: unknown) => sendMessage('placement', transform),
    [sendMessage]
  );

  useEffect(() => {
    if (!roomId || !serverUrl) {
      setParticipants([]);
      setMessages([]);
      setIsConnected(false);
      return;
    }

    setError(null);
    const ws = new WebSocket(`${serverUrl}/ar-collaboration?roomId=${roomId}&userId=${userId}&userName=${encodeURIComponent(userName)}`);
    socketRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => {
      setIsConnected(false);
      setParticipants([]);
    };
    ws.onerror = () => setError(new Error('WebSocket error'));
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as CollaborationMessage;
        if (msg.type === 'system' && (msg.payload as { type?: string })?.type === 'participants') {
          const list = (msg.payload as { participants?: CollaborationParticipant[] }).participants ?? [];
          setParticipants(list);
          onParticipantsChange?.(list);
        } else {
          setMessages((prev) => [...prev.slice(-99), { ...msg, id: msg.id || `${Date.now()}-${Math.random()}` }]);
          onMessage?.(msg);
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [roomId, serverUrl, userId, userName, onMessage, onParticipantsChange]);

  return {
    isConnected,
    participants,
    messages,
    error,
    sendMessage,
    sendChat,
    sendPlacement,
  };
}
