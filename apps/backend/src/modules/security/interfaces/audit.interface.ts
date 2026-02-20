export interface AuditLog {
  id?: string;
  eventType: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  action: string;
  success: boolean;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilters {
  userId?: string;
  eventType?: string;
  resourceType?: string;
  resourceId?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLogSearchParams {
  query?: string;
  filters?: AuditLogFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AuditLogStats {
  total: number;
  success: number;
  failures: number;
  byEventType: Record<string, number>;
  byResourceType: Record<string, number>;
  byUser: Record<string, number>;
  timeRange: {
    start: Date;
    end: Date;
  };
}


