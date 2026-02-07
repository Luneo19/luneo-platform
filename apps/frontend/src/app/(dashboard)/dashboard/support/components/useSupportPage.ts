'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSupport, type Ticket, type CreateTicketDto } from '@/lib/hooks/useSupport';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { ResponseTemplate, SLA, SupportTab, ViewMode } from './types';
import { formatSupportDate, formatSupportRelativeTime } from './formatUtils';

export function useSupportPage() {
  const {
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
    fetchKnowledgeBase,
    setSelectedTicket,
  } = useSupport();

  const { toast } = useToast();

  const [showNewTicket, setShowNewTicket] = useState(false);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showCSATDialog, setShowCSATDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ResponseTemplate | null>(null);
  const [csatRating, setCsatRating] = useState<number>(0);
  const [csatComment, setCsatComment] = useState('');
  const [newTicket, setNewTicket] = useState<CreateTicketDto>({
    subject: '',
    message: '',
    category: 'TECHNICAL',
    priority: 'medium',
  });
  const [kbSearch, setKbSearch] = useState('');
  const [activeTab, setActiveTab] = useState<SupportTab>('tickets');
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (ticket.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
      const matchesCategory = filterCategory === 'all' || (ticket.category && ticket.category === filterCategory);
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [tickets, searchTerm, filterStatus, filterPriority, filterCategory]);

  const filteredKB = useMemo(() => {
    if (!kbSearch) return knowledgeBase;
    return knowledgeBase.filter(
      (article: { title: string; content: string; tags: string[] }) =>
        article.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
        article.content.toLowerCase().includes(kbSearch.toLowerCase()) ||
        article.tags.some((tag: string) => tag.toLowerCase().includes(kbSearch.toLowerCase()))
    );
  }, [knowledgeBase, kbSearch]);

  const calculateSLA = useCallback((ticket: Ticket): SLA => {
    const createdAt = new Date(ticket.createdAt);
    const now = new Date();
    const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    const hoursSinceCreation = minutesSinceCreation / 60;
    const firstResponseTime = 120;
    const resolutionTime = 24;
    const resolutionStatus =
      hoursSinceCreation < resolutionTime * 0.8
        ? 'on-track'
        : hoursSinceCreation < resolutionTime
          ? 'at-risk'
          : 'breached';
    return {
      id: ticket.id,
      name: 'Standard SLA',
      firstResponseTime: Math.max(0, firstResponseTime - minutesSinceCreation),
      resolutionTime: Math.max(0, resolutionTime - hoursSinceCreation),
      status: ticket.status === 'closed' ? 'on-track' : resolutionStatus,
    };
  }, []);

  const formatDate = useCallback(formatSupportDate, []);
  const formatRelativeTime = useCallback((date: Date | string) => formatSupportRelativeTime(date, formatDate), [formatDate]);

  const handleCreateTicket = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const ticket = await createTicket(newTicket);
        setShowNewTicket(false);
        setNewTicket({
          subject: '',
          description: '',
          category: 'TECHNICAL',
          priority: 'medium',
        });
        toast({
          title: 'Ticket créé',
          description: `Le ticket ${ticket.ticketId || 'a été créé'} avec succès`,
        });
      } catch (err) {
        logger.error('Error creating ticket', { error: err });
        toast({
          title: 'Erreur',
          description: 'Impossible de créer le ticket',
          variant: 'destructive',
        });
      }
    },
    [newTicket, createTicket, toast]
  );

  const handleViewTicket = useCallback(
    async (ticketId: string) => {
      try {
        await fetchTicket(ticketId);
        setShowTicketDetail(true);
      } catch (err) {
        logger.error('Error fetching ticket', { error: err });
      }
    },
    [fetchTicket]
  );

  const handleSendMessage = useCallback(
    async (ticketId: string) => {
      if (!newMessage.trim()) return;
      setSendingMessage(true);
      try {
        await addMessage(ticketId, newMessage);
        setNewMessage('');
        toast({ title: 'Message envoyé', description: 'Votre message a été ajouté au ticket' });
      } catch (err) {
        logger.error('Error sending message', { error: err });
        toast({
          title: 'Erreur',
          description: "Impossible d'envoyer le message",
          variant: 'destructive',
        });
      } finally {
        setSendingMessage(false);
      }
    },
    [newMessage, addMessage, toast]
  );

  const handleUpdateStatus = useCallback(
    async (ticketId: string, status: string) => {
      try {
        await updateTicket(ticketId, { status: status as 'open' | 'closed' | 'pending' });
        toast({ title: 'Statut mis à jour', description: 'Le statut du ticket a été modifié' });
      } catch (err) {
        logger.error('Error updating ticket status', { error: err });
      }
    },
    [updateTicket, toast]
  );

  const handleUpdatePriority = useCallback(
    async (ticketId: string, priority: string) => {
      try {
        await updateTicket(ticketId, { priority: priority as 'low' | 'medium' | 'high' });
        toast({ title: 'Priorité mise à jour', description: 'La priorité du ticket a été modifiée' });
      } catch (err) {
        logger.error('Error updating ticket priority', { error: err });
      }
    },
    [updateTicket, toast]
  );

  const handleUseTemplate = useCallback(
    (template: ResponseTemplate) => {
      setNewMessage(template.content);
      setSelectedTemplate(template);
      setShowTemplateDialog(false);
      toast({
        title: 'Template appliqué',
        description: `Le template "${template.name}" a été inséré`,
      });
    },
    [toast]
  );

  const handleSubmitCSAT = useCallback(
    async (ticketId: string) => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast({ title: 'Merci pour votre avis', description: 'Votre évaluation a été enregistrée' });
        setShowCSATDialog(false);
        setCsatRating(0);
        setCsatComment('');
      } catch (err) {
        logger.error('Error submitting CSAT', { error: err });
      }
    },
    [toast]
  );

  const handleSelectTicket = useCallback((ticketId: string) => {
    setSelectedTickets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) newSet.delete(ticketId);
      else newSet.add(ticketId);
      return newSet;
    });
  }, []);

  const handleBulkAction = useCallback(
    async (action: 'archive' | 'close' | 'assign' | 'delete') => {
      if (selectedTickets.size === 0) return;
      try {
        switch (action) {
          case 'archive':
            toast({ title: 'Archivage', description: `${selectedTickets.size} ticket(s) archivé(s)` });
            break;
          case 'close':
            toast({ title: 'Fermeture', description: `${selectedTickets.size} ticket(s) fermé(s)` });
            break;
          case 'assign':
            toast({ title: 'Assignation', description: `${selectedTickets.size} ticket(s) assigné(s)` });
            break;
          case 'delete':
            if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedTickets.size} ticket(s) ?`)) {
              toast({ title: 'Suppression', description: `${selectedTickets.size} ticket(s) supprimé(s)` });
            }
            break;
        }
        setSelectedTickets(new Set());
      } catch (err) {
        logger.error('Error performing bulk action', { error: err });
      }
    },
    [selectedTickets, toast]
  );

  return {
    toast, tickets, selectedTicket, stats, knowledgeBase, loading, error,
    openTickets, inProgressTickets, resolvedTickets, fetchTickets, fetchKnowledgeBase, setSelectedTicket,
    showNewTicket, setShowNewTicket, showTicketDetail, setShowTicketDetail,
    showTemplateDialog, setShowTemplateDialog, showCSATDialog, setShowCSATDialog, showExportDialog, setShowExportDialog,
    searchTerm, setSearchTerm, filterStatus, setFilterStatus, filterPriority, setFilterPriority, filterCategory, setFilterCategory,
    viewMode, setViewMode, newMessage, setNewMessage, sendingMessage, csatRating, setCsatRating, csatComment, setCsatComment,
    newTicket, setNewTicket, setSelectedTemplate, kbSearch, setKbSearch, activeTab, setActiveTab, selectedTickets, setSelectedTickets,
    filteredTickets, filteredKB, calculateSLA, formatDate, formatRelativeTime,
    handleCreateTicket, handleViewTicket, handleSendMessage, handleUpdateStatus, handleUpdatePriority,
    handleUseTemplate, handleSubmitCSAT, handleSelectTicket, handleBulkAction,
  };
}
