export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? 'https://app.luneo.app' : 'https://luneo.app');
export const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.luneo.app' : 'http://localhost:3001');
export const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_ENGINE_URL || process.env.AI_ENGINE_URL || (process.env.NODE_ENV === 'production' ? 'https://ai.luneo.app' : 'http://localhost:8000');
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || (process.env.NODE_ENV === 'production' ? 'wss://api.luneo.app' : 'ws://localhost:3001');
