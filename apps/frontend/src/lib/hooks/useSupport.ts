/**
 * Hook personnalisé pour gérer le support
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

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
}

export interface TicketMessage {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  isFromSupport: boolean;
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
      const response = await fetch('/api/support/tickets');
      const data = await response.json();
      if (response.ok) {
        setTickets(data.tickets || []);
      } else {
        setError(data.message || 'Erreur lors de la récupération des tickets');
      }
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
      const response = await fetch(`/api/support/tickets/${ticketId}`);
      const data = await response.json();
      if (response.ok) {
        setSelectedTicket(data.ticket);
      } else {
        setError(data.message || 'Erreur lors de la récupération du ticket');
      }
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
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (response.ok) {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t));
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, ...updates });
        }
        toast({ title: 'Succès', description: 'Ticket mis à jour' });
      } else {
        setError(data.message || 'Erreur lors de la mise à jour du ticket');
      }
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
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });
      const data = await response.json();
      if (response.ok) {
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({
            ...selectedTicket,
            messages: [...selectedTicket.messages, data.message],
          });
        }
        toast({ title: 'Succès', description: 'Message ajouté' });
      } else {
        setError(data.message || 'Erreur lors de l\'ajout du message');
      }
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
        const response = await fetch('/api/support/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Erreur lors de la création du ticket');
        }

        toast({ title: 'Succès', description: 'Ticket créé avec succès' });
        return { success: true, ticketId: result.ticketId };
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
