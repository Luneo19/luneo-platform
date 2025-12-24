/**
 * Liveblocks Authentication Endpoint
 * C-002: Système d'authentification pour rooms collaboratifs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

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
      logger.error('LIVEBLOCKS_SECRET_KEY not configured', new Error('Missing Liveblocks configuration'));
      return NextResponse.json(
        { error: 'Collaboration service not configured' },
        { status: 500 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user profile for name and avatar
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();

    // Check if user has access to this room (design)
    // Room ID format: design_<designId>
    const designIdMatch = room.match(/^design_(.+)$/);
    if (designIdMatch) {
      const designId = designIdMatch[1];
      
      // Check design ownership or team membership
      const { data: design, error: designError } = await supabase
        .from('designs')
        .select('id, user_id, team_id')
        .eq('id', designId)
        .single();

      if (designError || !design) {
        return NextResponse.json(
          { error: 'Design not found or access denied' },
          { status: 403 }
        );
      }

      // Check if user owns the design
      let hasAccess = design.user_id === user.id;

      // Check team membership if design has team_id
      if (!hasAccess && design.team_id) {
        const { data: teamMember, error: teamError } = await supabase
          .from('team_members')
          .select('id, role, status')
          .eq('team_id', design.team_id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (!teamError && teamMember) {
          hasAccess = true;
        }
      }

      // Check for shared access if still no access
      if (!hasAccess) {
        const { data: share } = await supabase
          .from('design_shares')
          .select('permission')
          .eq('design_id', designId)
          .eq('user_id', user.id)
          .single();

        if (!share) {
          return NextResponse.json(
            { error: 'Access denied to this design' },
            { status: 403 }
          );
        }
      }
    }

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
          name: profile?.full_name || user.email?.split('@')[0] || 'Anonymous',
          avatar: profile?.avatar_url || null,
          color: generateColorFromId(user.id),
        },
        permissions: {
          [room]: ['room:write'],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Liveblocks authorization failed', new Error(error));
      return NextResponse.json(
        { error: 'Failed to authorize collaboration session' },
        { status: 500 }
      );
    }

    const authData = await response.json();

    logger.info('Liveblocks session created', {
      userId: user.id,
      room,
    });

    return NextResponse.json(authData);

  } catch (error) {
    logger.error('Liveblocks auth error', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

