/**
 * Hook personnalisé pour gérer le support
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

export interface Ticket {
  id: string;
  subject: string;
  description?: string;
  ticketNumber?: string;
  category?: string;
  status: 'open' | 'closed' | 'pending';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  messages: TicketMessage[];
  tags?: string[];
  activities?: Array<{ id: string; type: string; description: string; action?: string; oldValue?: string; newValue?: string; createdAt: Date; user?: string }>;
}

export interface TicketMessage {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  isFromSupport: boolean;
  isInternal?: boolean;
  attachments?: Array<{ id: string; name: string; url: string }>;
}

export interface CreateTicketDto {
  subject: string;
  message?: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
}

export function useSupport() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    closed: tickets.filter(t => t.status === 'closed').length,
    pending: tickets.filter(t => t.status === 'pending').length,
  };
  
  const openTickets = tickets.filter(t => t.status === 'open');
  const inProgressTickets = tickets.filter(t => t.status === 'pending');
  const resolvedTickets = tickets.filter(t => t.status === 'closed');
  const knowledgeBase: any[] = [];
  
  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<{ tickets?: Ticket[] }>('/api/v1/support/tickets');
      setTickets(data?.tickets ?? []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération des tickets');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const fetchTicket = useCallback(async (ticketId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<{ ticket?: Ticket }>(`/api/v1/support/tickets/${ticketId}`);
      setSelectedTicket(data?.ticket ?? (data as unknown as Ticket));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération du ticket');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const updateTicket = useCallback(async (ticketId: string, updates: Partial<Ticket>) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.patch(`/api/v1/support/tickets/${ticketId}`, updates);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, ...updates });
      }
      toast({ title: 'Succès', description: 'Ticket mis à jour' });
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du ticket');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTicket, toast]);
  
  const addMessage = useCallback(async (ticketId: string, message: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.post<{ message?: TicketMessage }>(`/api/v1/support/tickets/${ticketId}/messages`, { content: message });
      if (selectedTicket?.id === ticketId && data?.message) {
        setSelectedTicket({
          ...selectedTicket,
          messages: [...selectedTicket.messages, data.message],
        });
      }
      toast({ title: 'Succès', description: 'Message ajouté' });
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout du message');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTicket, toast]);
  
  const fetchKnowledgeBase = useCallback(async () => {
    // Placeholder
  }, []);

  const createTicket = useCallback(
    async (data: CreateTicketDto): Promise<{ success: boolean; ticketId?: string }> => {
      try {
        setIsLoading(true);
        const result = await api.post<{ ticketId?: string; id?: string }>('/api/v1/support/tickets', data);
        const ticketId = result?.ticketId ?? result?.id;
        toast({ title: 'Succès', description: 'Ticket créé avec succès' });
        return { success: true, ticketId };
      } catch (error: any) {
        logger.error('Error creating ticket', { error });
        toast({
          title: 'Erreur',
          description: error.message || 'Erreur lors de la création du ticket',
          variant: 'destructive',
        });
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  return {
    tickets,
    selectedTicket,
    setSelectedTicket,
    stats,
    knowledgeBase,
    loading: isLoading,
    isLoading,
    error,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    fetchTickets,
    fetchTicket,
    createTicket,
    updateTicket,
    addMessage,
    fetchKnowledgeBase,
  };
}
