import type { LucideIcon } from 'lucide-react';

export interface ResponseTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  tags: string[];
}

export interface SLA {
  id: string;
  name: string;
  firstResponseTime: number;
  resolutionTime: number;
  status: 'on-track' | 'at-risk' | 'breached';
}

export interface CSAT {
  ticketId: string;
  rating: number;
  comment?: string;
  submittedAt: string;
}

export type SupportTab = 'tickets' | 'knowledge' | 'templates' | 'analytics';
export type ViewMode = 'list' | 'grid' | 'kanban';

export interface StatusConfigItem {
  label: string;
  color: string;
  bgColor: string;
}

export interface PriorityConfigItem {
  label: string;
  color: string;
  borderColor: string;
}

export interface CategoryConfigItem {
  label: string;
  icon: LucideIcon;
}
