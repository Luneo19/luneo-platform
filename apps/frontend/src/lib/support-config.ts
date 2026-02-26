export const SUPPORT_CONFIG = {
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@luneo.app',
  liveChatUrl: process.env.NEXT_PUBLIC_SUPPORT_CHAT_URL || '',
  supportPortalPath: '/help/support',
  contactPath: '/contact',
} as const;

export function hasLiveChatConfigured(): boolean {
  return SUPPORT_CONFIG.liveChatUrl.trim().length > 0;
}
