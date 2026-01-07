/**
 * Types pour la page Security
 */

export interface SecuritySession {
  id: string;
  device?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'other';
  browser?: string;
  os?: string;
  location?: string;
  ipAddress?: string;
  lastActive?: Date;
  isCurrent?: boolean;
  isTrusted?: boolean;
  fingerprint?: string;
  user_agent?: string;
  created_at?: string;
  expires_at?: string;
}

export interface SecurityLog {
  id: string;
  type: 'login' | 'logout' | 'password_change' | '2fa_enabled' | '2fa_disabled' | 'session_revoked' | 'suspicious_activity';
  description: string;
  ipAddress?: string;
  location?: string;
  timestamp: Date;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'success' | 'failed' | 'blocked';
}

export interface TwoFactorStatus {
  enabled: boolean;
  verified_at?: string | null;
  created_at?: string | null;
  qrCode?: string;
  backupCodes?: string[];
}


