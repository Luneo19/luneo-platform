'use client';

/**
 * Presence indicator: show avatars/names of other users in AR room.
 * Position in 3D space can be driven by shared anchor or fixed overlay.
 * @module ar/collaboration/PresenceIndicator
 */

import React from 'react';
import Image from 'next/image';

export interface PresenceUser {
  id: string;
  name?: string;
  avatarUrl?: string;
  position?: { x: number; y: number; z: number };
}

export interface PresenceIndicatorProps {
  users: PresenceUser[];
  className?: string;
}

/**
 * React component: list of other users in the room (avatars/names).
 */
export function PresenceIndicator({
  users,
  className = '',
}: PresenceIndicatorProps): React.ReactElement {
  return (
    <div
      className={`ar-presence-indicator ${className}`}
      role="list"
      aria-label="Participants in AR room"
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 10,
        display: 'flex',
        gap: '8px',
        flexDirection: 'row-reverse',
      }}
    >
      {users.map((u) => (
        <div
          key={u.id}
          role="listitem"
          title={u.name ?? u.id}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.5)',
          }}
        >
          {u.avatarUrl ? (
            <Image width={200} height={200}
              src={u.avatarUrl}
              alt={u.name ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            unoptimized />
          ) : (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                fontSize: '12px',
                color: '#fff',
              }}
            >
              {(u.name ?? u.id).charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
