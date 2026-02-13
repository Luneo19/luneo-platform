/**
 * Liveblocks Authentication Endpoint
 * C-002: Système d'authentification pour rooms collaboratifs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { serverLogger } from '@/lib/logger-server';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

const LIVEBLOCKS_SECRET_KEY = process.env.LIVEBLOCKS_SECRET_KEY;

// Generate a consistent color for a user based on their ID
function generateColorFromId(id: string): string {
  const colors = [
    '#E57373', '#F06292', '#BA68C8', '#9575CD',
    '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1',
    '#4DB6AC', '#81C784', '#AED581', '#DCE775',
    '#FFD54F', '#FFB74D', '#FF8A65', '#A1887F',
  ];
  
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export async function POST(request: NextRequest) {
  try {
    const { room } = await request.json();

    if (!room) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    if (!LIVEBLOCKS_SECRET_KEY) {
      serverLogger.error('LIVEBLOCKS_SECRET_KEY not configured', new Error('Missing Liveblocks configuration'));
      return NextResponse.json(
        { error: 'Collaboration service not configured' },
        { status: 500 }
      );
    }

    // Get authenticated user
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Forward to backend: check if user has access to this room (design)
    // Room ID format: design_<designId>
    const designIdMatch = room.match(/^design_(.+)$/);
    if (designIdMatch) {
      const designId = designIdMatch[1];
      
      // Check design access via backend
      const accessResponse = await fetch(`${API_URL}/api/v1/designs/${designId}/access`, {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      });

      if (!accessResponse.ok) {
        return NextResponse.json(
          { error: 'Design not found or access denied' },
          { status: 403 }
        );
      }

      const { profile } = await accessResponse.json();
    } else {
      // For non-design rooms, get profile from backend
      const profileResponse = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      });
      
      const profile = profileResponse.ok ? await profileResponse.json() : null;
    }

    // Get user profile for name and avatar
    const profileResponse = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });
    
    const profileData = profileResponse.ok ? await profileResponse.json() : null;

    // Create Liveblocks session token
    const response = await fetch('https://api.liveblocks.io/v2/authorize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LIVEBLOCKS_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        userInfo: {
          name: profileData?.full_name || profileData?.name || user.email?.split('@')[0] || 'Anonymous',
          avatar: profileData?.avatar_url || profileData?.avatar || null,
          color: generateColorFromId(user.id),
        },
        permissions: {
          [room]: ['room:write'],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      serverLogger.error('Liveblocks authorization failed', new Error(error));
      return NextResponse.json(
        { error: 'Failed to authorize collaboration session' },
        { status: 500 }
      );
    }

    const authData = await response.json();

    serverLogger.info('Liveblocks session created', {
      userId: user.id,
      room,
    });

    return NextResponse.json(authData);

  } catch (error) {
    serverLogger.error('Liveblocks auth error', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

