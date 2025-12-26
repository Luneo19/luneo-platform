import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

/**
 * Support Hook - Enterprise Grade
 * Handles all support tickets and knowledge base operations
 * Inspired by: Zendesk, Intercom, Linear Support
 */

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketCategory = 'BILLING' | 'TECHNICAL' | 'ACCOUNT' | 'FEATURE_REQUEST' | 'BUG' | 'INTEGRATION' | 'OTHER';
export type MessageType = 'USER' | 'AGENT' | 'SYSTEM' | 'INTERNAL';

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  userId: string;
  assignedTo?: string;
  assignedAt?: Date;
  tags: string[];
  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  };
  assignedToUser?: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  };
  messages?: TicketMessage[];
  attachments?: TicketAttachment[];
  activities?: TicketActivity[];
  _count?: {
    messages: number;
    attachments: number;
  };
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  type: MessageType;
  content: string;
  userId?: string;
  isInternal: boolean;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  };
  attachments?: TicketAttachment[];
}

export interface TicketAttachment {
  id: string;
  ticketId?: string;
  messageId?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface TicketActivity {
  id: string;
  ticketId: string;
  action: string;
  userId?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketStats {
  total: number;
  byStatus: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  byPriority: Record<TicketPriority, number>;
  byCategory: Record<TicketCategory, number>;
}

export interface CreateTicketDto {
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateMessageDto {
  content: string;
  type?: MessageType;
  isInternal?: boolean;
}

export interface UpdateTicketDto {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  subject?: string;
  description?: string;
  tags?: string[];
  assignedTo?: string;
}

export function useSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTickets = useCallback(
    async (filters?: {
      status?: TicketStatus;
      priority?: TicketPriority;
      category?: TicketCategory;
      search?: string;
      limit?: number;
      offset?: number;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.priority) params.append('priority', filters.priority);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.offset) params.append('offset', filters.offset.toString());

        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/support/tickets?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const ticketsData = data.data?.tickets || data.tickets || [];

        setTickets(
          ticketsData.map((ticket: any) => ({
            ...ticket,
            createdAt: new Date(ticket.createdAt),
            updatedAt: new Date(ticket.updatedAt),
            assignedAt: ticket.assignedAt ? new Date(ticket.assignedAt) : undefined,
            firstResponseAt: ticket.firstResponseAt ? new Date(ticket.firstResponseAt) : undefined,
            resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : undefined,
            closedAt: ticket.closedAt ? new Date(ticket.closedAt) : undefined,
          }))
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Error fetching tickets', { error: err });
        setError(errorMessage);
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const fetchTicket = useCallback(
    async (ticketId: string) => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/support/tickets/${ticketId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const ticketData = data.data?.ticket || data.ticket || data;

        const ticket: Ticket = {
          ...ticketData,
          createdAt: new Date(ticketData.createdAt),
          updatedAt: new Date(ticketData.updatedAt),
          assignedAt: ticketData.assignedAt ? new Date(ticketData.assignedAt) : undefined,
          firstResponseAt: ticketData.firstResponseAt ? new Date(ticketData.firstResponseAt) : undefined,
          resolvedAt: ticketData.resolvedAt ? new Date(ticketData.resolvedAt) : undefined,
          closedAt: ticketData.closedAt ? new Date(ticketData.closedAt) : undefined,
          messages: (ticketData.messages || []).map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt),
            updatedAt: new Date(msg.updatedAt),
            readAt: msg.readAt ? new Date(msg.readAt) : undefined,
          })),
          activities: (ticketData.activities || []).map((act: any) => ({
            ...act,
            createdAt: new Date(act.createdAt),
          })),
        };

        setSelectedTicket(ticket);
        return ticket;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Error fetching ticket', { error: err });
        setError(errorMessage);
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const createTicket = useCallback(
    async (dto: CreateTicketDto) => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/support/tickets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dto),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const ticket = data.data?.ticket || data.ticket || data;

        setTickets((prev) => [
          {
            ...ticket,
            createdAt: new Date(ticket.createdAt),
            updatedAt: new Date(ticket.updatedAt),
          },
          ...prev,
        ]);

        toast({
          title: 'Ticket créé',
          description: `Le ticket ${ticket.ticketNumber} a été créé avec succès`,
        });

        return ticket;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Error creating ticket', { error: err });
        setError(errorMessage);
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const updateTicket = useCallback(
    async (ticketId: string, dto: UpdateTicketDto) => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/support/tickets/${ticketId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dto),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const ticket = data.data?.ticket || data.ticket || data;

        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...ticket,
                  createdAt: new Date(ticket.createdAt),
                  updatedAt: new Date(ticket.updatedAt),
                }
              : t
          )
        );

        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({
            ...ticket,
            createdAt: new Date(ticket.createdAt),
            updatedAt: new Date(ticket.updatedAt),
          });
        }

        toast({
          title: 'Ticket mis à jour',
          description: 'Le ticket a été mis à jour avec succès',
        });

        return ticket;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Error updating ticket', { error: err });
        setError(errorMessage);
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [selectedTicket, toast]
  );

  const addMessage = useCallback(
    async (ticketId: string, dto: CreateMessageDto) => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dto),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const message = data.data?.message || data.message || data;

        // Refresh ticket to get updated messages
        await fetchTicket(ticketId);

        toast({
          title: 'Message ajouté',
          description: 'Votre message a été ajouté au ticket',
        });

        return message;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Error adding message', { error: err });
        setError(errorMessage);
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchTicket, toast]
  );

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/support/tickets/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.data?.stats || data.stats || data);
    } catch (err) {
      logger.error('Error fetching stats', { error: err });
    }
  }, []);

  const fetchKnowledgeBase = useCallback(
    async (filters?: { category?: string; search?: string; featured?: boolean }) => {
      try {
        const params = new URLSearchParams();
        if (filters?.category) params.append('category', filters.category);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.featured) params.append('featured', 'true');

        const response = await fetch(`/api/support/knowledge-base/articles?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch knowledge base');
        }

        const data = await response.json();
        setKnowledgeBase(data.data?.articles || data.articles || []);
      } catch (err) {
        logger.error('Error fetching knowledge base', { error: err });
      }
    },
    []
  );

  useEffect(() => {
    fetchTickets();
    fetchStats();
    fetchKnowledgeBase({ featured: true });
  }, [fetchTickets, fetchStats, fetchKnowledgeBase]);

  const openTickets = useMemo(() => tickets.filter((t) => t.status === 'OPEN'), [tickets]);
  const inProgressTickets = useMemo(() => tickets.filter((t) => t.status === 'IN_PROGRESS'), [tickets]);
  const resolvedTickets = useMemo(() => tickets.filter((t) => t.status === 'RESOLVED'), [tickets]);

  return {
    tickets,
    selectedTicket,
    stats,
    knowledgeBase,
    loading,
    error,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    fetchTickets,
    fetchTicket,
    createTicket,
    updateTicket,
    addMessage,
    fetchStats,
    fetchKnowledgeBase,
    setSelectedTicket,
  };
}

