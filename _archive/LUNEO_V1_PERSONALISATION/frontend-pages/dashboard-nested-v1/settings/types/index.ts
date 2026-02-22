/**
 * Types pour la page Settings
 */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  bio?: string;
  location?: string;
  avatar_url?: string;
  timezone: string;
  role?: string;
}

export interface SecuritySession {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

export interface NotificationPreference {
  email: {
    orders: boolean;
    designs: boolean;
    marketing: boolean;
    securityAlerts: boolean;
  };
  push: {
    orders: boolean;
    designs: boolean;
  };
  inApp: {
    orders: boolean;
    designs: boolean;
    system: boolean;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
}



