export interface AffiliateLink {
  id: string;
  code: string;
  url: string;
  name?: string;
  clicks: number;
  conversions: number;
  revenue: number;
  createdAt: Date;
  isActive: boolean;
}

export interface Referral {
  id: string;
  email: string;
  name?: string;
  status: 'pending' | 'active' | 'converted' | 'expired';
  signupDate: Date;
  conversionDate?: Date;
  revenue: number;
  commission: number;
  linkCode: string;
}

export interface Commission {
  id: string;
  referralId: string;
  referralEmail: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: Date;
  paidAt?: Date;
  description: string;
}

export interface AffiliateStats {
  totalReferrals: number;
  activeReferrals: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  conversionRate: number;
  averageCommission: number;
  clickThroughRate: number;
  topReferral: Referral | null;
}

export type AffiliateTabValue =
  | 'overview'
  | 'links'
  | 'referrals'
  | 'commissions'
  | 'tools'
  | 'settings'
  | 'ai-ml'
  | 'collaboration'
  | 'performance'
  | 'security'
  | 'i18n'
  | 'accessibility'
  | 'workflow';
