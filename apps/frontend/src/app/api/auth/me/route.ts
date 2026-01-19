/**
 * ★★★ API ROUTE - AUTH ME ★★★
 * Proxy vers le backend pour récupérer l'utilisateur connecté
 * Utilise les cookies JWT définis par le backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forwarder vers le backend
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Construire les cookies pour la requête vers le backend
    const refreshToken = cookieStore.get('refreshToken')?.value || '';
    const cookieHeader = refreshToken 
      ? `accessToken=${accessToken}; refreshToken=${refreshToken}`
      : `accessToken=${accessToken}`;
    
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      // Important : Ne pas mettre en cache pour les routes d'authentification
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await response.json();
    return NextResponse.json(user);
  } catch (error) {
    console.error('[API Auth Me] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
