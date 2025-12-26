'use client';

/**
 * Support Dashboard Page - Enterprise Grade
 * Complete support system with tickets, messages, knowledge base
 * Inspired by: Zendesk, Intercom, Linear Support, GitHub Issues
 * 
 * Features:
 * - Complete ticket management
 * - Real-time messaging
 * - Knowledge base integration
 * - Advanced search and filters
 * - File attachments
 * - Activity timeline
 * - Professional UX/UI
 * - Responsive design
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TicketIcon,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Loader2,
  Send,
  Paperclip,
  X,
  User,
  Tag,
  Calendar,
  FileText,
  BookOpen,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Trash2,
  Archive,
  RefreshCw,
  Download,
  Share2,
  Copy,
  MoreVertical,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSupport, type Ticket, type TicketMessage, type CreateTicketDto } from '@/lib/hooks/useSupport';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  OPEN: { label: 'Ouvert', color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30' },
  IN_PROGRESS: { label: 'En cours', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500/30' },
  WAITING_CUSTOMER: { label: 'En attente client', color: 'text-orange-400', bgColor: 'bg-orange-500/20 border-orange-500/30' },
  RESOLVED: { label: 'Résolu', color: 'text-green-400', bgColor: 'bg-green-500/20 border-green-500/30' },
  CLOSED: { label: 'Fermé', color: 'text-gray-400', bgColor: 'bg-gray-500/20 border-gray-500/30' },
  CANCELLED: { label: 'Annulé', color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30' },
};

const priorityConfig: Record<string, { label: string; color: string; borderColor: string }> = {
  LOW: { label: 'Basse', color: 'text-gray-400', borderColor: 'border-gray-500' },
  MEDIUM: { label: 'Moyenne', color: 'text-blue-400', borderColor: 'border-blue-500' },
  HIGH: { label: 'Haute', color: 'text-orange-400', borderColor: 'border-orange-500' },
  URGENT: { label: 'Urgente', color: 'text-red-400', borderColor: 'border-red-500' },
};

const categoryConfig: Record<string, { label: string; icon: React.ElementType }> = {
  BILLING: { label: 'Facturation', icon: FileText },
  TECHNICAL: { label: 'Technique', icon: AlertCircle },
  ACCOUNT: { label: 'Compte', icon: User },
  FEATURE_REQUEST: { label: 'Fonctionnalité', icon: Plus },
  BUG: { label: 'Bug', icon: AlertCircle },
  INTEGRATION: { label: 'Intégration', icon: Share2 },
  OTHER: { label: 'Autre', icon: HelpCircle },
};

function SupportPageContent() {
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

  const [showNewTicket, setShowNewTicket] = useState(false);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newTicket, setNewTicket] = useState<CreateTicketDto>({
    subject: '',
    description: '',
    category: 'TECHNICAL',
    priority: 'MEDIUM',
  });
  const [kbSearch, setKbSearch] = useState('');
  const { toast } = useToast();

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
      const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [tickets, searchTerm, filterStatus, filterPriority, filterCategory]);

  const filteredKB = useMemo(() => {
    if (!kbSearch) return knowledgeBase;
    return knowledgeBase.filter(
      (article) =>
        article.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
        article.content.toLowerCase().includes(kbSearch.toLowerCase()) ||
        article.tags.some((tag) => tag.toLowerCase().includes(kbSearch.toLowerCase()))
    );
  }, [knowledgeBase, kbSearch]);

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
          priority: 'MEDIUM',
        });
        toast({
          title: 'Ticket créé',
          description: `Le ticket ${ticket.ticketNumber} a été créé avec succès`,
        });
      } catch (err) {
        logger.error('Error creating ticket', { error: err });
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
        await addMessage(ticketId, {
          content: newMessage,
          type: 'USER',
        });
        setNewMessage('');
        toast({
          title: 'Message envoyé',
          description: 'Votre message a été ajouté au ticket',
        });
      } catch (err) {
        logger.error('Error sending message', { error: err });
        toast({
          title: 'Erreur',
          description: 'Impossible d\'envoyer le message',
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
        await updateTicket(ticketId, { status: status as any });
        toast({
          title: 'Statut mis à jour',
          description: 'Le statut du ticket a été modifié',
        });
      } catch (err) {
        logger.error('Error updating ticket status', { error: err });
      }
    },
    [updateTicket, toast]
  );

  const handleUpdatePriority = useCallback(
    async (ticketId: string, priority: string) => {
      try {
        await updateTicket(ticketId, { priority: priority as any });
        toast({
          title: 'Priorité mise à jour',
          description: 'La priorité du ticket a été modifiée',
        });
      } catch (err) {
        logger.error('Error updating ticket priority', { error: err });
      }
    },
    [updateTicket, toast]
  );

  const formatDate = useCallback((date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }, []);

  const formatRelativeTime = useCallback((date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return formatDate(d);
  }, [formatDate]);

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Chargement des tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <TicketIcon className="w-8 h-8 text-cyan-400" />
            Support
          </h1>
          <p className="text-gray-400 mt-1">Gérez vos tickets et demandes d'assistance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => fetchTickets()}
            className="border-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button
            onClick={() => setShowNewTicket(true)}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau ticket
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats?.total || tickets.length, color: 'cyan', icon: TicketIcon },
          { label: 'Ouverts', value: stats?.byStatus?.open || openTickets.length, color: 'blue', icon: AlertCircle },
          { label: 'En cours', value: stats?.byStatus?.inProgress || inProgressTickets.length, color: 'yellow', icon: Clock },
          { label: 'Résolus', value: stats?.byStatus?.resolved || resolvedTickets.length, color: 'green', icon: CheckCircle },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 bg-gray-800/50 border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-${stat.color}-500/20`}>
                    <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="bg-gray-800/50 border-gray-700">
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="knowledge">Base de connaissances</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un ticket..."
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="OPEN">Ouverts</SelectItem>
                <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                <SelectItem value="WAITING_CUSTOMER">En attente</SelectItem>
                <SelectItem value="RESOLVED">Résolus</SelectItem>
                <SelectItem value="CLOSED">Fermés</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="LOW">Basse</SelectItem>
                <SelectItem value="MEDIUM">Moyenne</SelectItem>
                <SelectItem value="HIGH">Haute</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="BILLING">Facturation</SelectItem>
                <SelectItem value="TECHNICAL">Technique</SelectItem>
                <SelectItem value="ACCOUNT">Compte</SelectItem>
                <SelectItem value="FEATURE_REQUEST">Fonctionnalité</SelectItem>
                <SelectItem value="BUG">Bug</SelectItem>
                <SelectItem value="INTEGRATION">Intégration</SelectItem>
                <SelectItem value="OTHER">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tickets List */}
          {filteredTickets.length === 0 ? (
            <Card className="p-12 bg-gray-800/50 border-gray-700 text-center">
              <TicketIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Aucun ticket</h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all'
                  ? 'Aucun résultat pour votre recherche'
                  : 'Vous n\'avez pas encore créé de ticket'}
              </p>
              {!searchTerm && filterStatus === 'all' && filterPriority === 'all' && filterCategory === 'all' && (
                <Button onClick={() => setShowNewTicket(true)} variant="outline" className="border-gray-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un ticket
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredTickets.map((ticket, index) => {
                  const CategoryIcon = categoryConfig[ticket.category]?.icon || HelpCircle;
                  return (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={cn(
                          'p-4 bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all cursor-pointer border-l-4',
                          priorityConfig[ticket.priority]?.borderColor
                        )}
                        onClick={() => handleViewTicket(ticket.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={statusConfig[ticket.status]?.bgColor}>
                                {statusConfig[ticket.status]?.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {ticket.ticketNumber}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <CategoryIcon className="w-3 h-3" />
                                <span>{categoryConfig[ticket.category]?.label}</span>
                              </div>
                            </div>
                            <h3 className="font-semibold text-white truncate mb-1">{ticket.subject}</h3>
                            <p className="text-sm text-gray-400 line-clamp-2 mb-2">{ticket.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatRelativeTime(ticket.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {ticket._count?.messages || 0} messages
                              </span>
                              {ticket.tags.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  {ticket.tags.length} tags
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                placeholder="Rechercher dans la base de connaissances..."
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {filteredKB.length === 0 ? (
            <Card className="p-12 bg-gray-800/50 border-gray-700 text-center">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Aucun article</h3>
              <p className="text-gray-400">
                {kbSearch ? 'Aucun résultat pour votre recherche' : 'Aucun article disponible'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredKB.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-6 bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all cursor-pointer h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline" className="text-xs">
                        {article.category}
                      </Badge>
                      {article.isFeatured && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-white mb-2 line-clamp-2">{article.title}</h3>
                    {article.excerpt && (
                      <p className="text-sm text-gray-400 line-clamp-3 mb-4 flex-1">{article.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-700">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {article.helpful}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        Lire <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* New Ticket Modal */}
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau ticket</DialogTitle>
            <DialogDescription>
              Créez un nouveau ticket de support. Notre équipe vous répondra dans les plus brefs délais.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sujet *</label>
              <Input
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                placeholder="Décrivez brièvement votre problème"
                className="bg-gray-900 border-gray-600 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Catégorie *</label>
                <Select
                  value={newTicket.category}
                  onValueChange={(value) => setNewTicket({ ...newTicket, category: value as any })}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BILLING">Facturation</SelectItem>
                    <SelectItem value="TECHNICAL">Technique</SelectItem>
                    <SelectItem value="ACCOUNT">Compte</SelectItem>
                    <SelectItem value="FEATURE_REQUEST">Fonctionnalité</SelectItem>
                    <SelectItem value="BUG">Bug</SelectItem>
                    <SelectItem value="INTEGRATION">Intégration</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Priorité *</label>
                <Select
                  value={newTicket.priority}
                  onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as any })}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Basse</SelectItem>
                    <SelectItem value="MEDIUM">Moyenne</SelectItem>
                    <SelectItem value="HIGH">Haute</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
              <Textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Décrivez votre problème en détail. Plus vous fournissez d'informations, plus nous pourrons vous aider rapidement."
                rows={6}
                className="bg-gray-900 border-gray-600 text-white resize-none"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewTicket(false)}
                className="flex-1 border-gray-600"
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                <Send className="w-4 h-4 mr-2" />
                Créer le ticket
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Modal */}
      <Dialog open={showTicketDetail} onOpenChange={setShowTicketDetail}>
        <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 text-white max-h-[90vh] overflow-hidden flex flex-col">
          {selectedTicket && (
            <>
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={statusConfig[selectedTicket.status]?.bgColor}>
                        {statusConfig[selectedTicket.status]?.label}
                      </Badge>
                      <Badge variant="outline">{selectedTicket.ticketNumber}</Badge>
                      <Badge variant="outline" className={priorityConfig[selectedTicket.priority]?.color}>
                        {priorityConfig[selectedTicket.priority]?.label}
                      </Badge>
                    </div>
                    <DialogTitle className="text-xl">{selectedTicket.subject}</DialogTitle>
                    <DialogDescription className="text-gray-400 mt-2">
                      {formatDate(selectedTicket.createdAt)} • {selectedTicket._count?.messages || 0} messages
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value)}
                    >
                      <SelectTrigger className="w-[150px] bg-gray-900 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Ouvert</SelectItem>
                        <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                        <SelectItem value="WAITING_CUSTOMER">En attente</SelectItem>
                        <SelectItem value="RESOLVED">Résolu</SelectItem>
                        <SelectItem value="CLOSED">Fermé</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedTicket.priority}
                      onValueChange={(value) => handleUpdatePriority(selectedTicket.id, value)}
                    >
                      <SelectTrigger className="w-[150px] bg-gray-900 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Basse</SelectItem>
                        <SelectItem value="MEDIUM">Moyenne</SelectItem>
                        <SelectItem value="HIGH">Haute</SelectItem>
                        <SelectItem value="URGENT">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6">
                  {/* Description */}
                  <Card className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 whitespace-pre-wrap">{selectedTicket.description}</p>
                    </CardContent>
                  </Card>

                  {/* Messages */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Messages</h3>
                    {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                      <div className="space-y-4">
                        {selectedTicket.messages.map((message) => (
                          <Card
                            key={message.id}
                            className={cn(
                              'bg-gray-900/50 border-gray-700',
                              message.isInternal && 'border-yellow-500/30 bg-yellow-500/5'
                            )}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-cyan-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-white">
                                      {message.user?.name || message.user?.email || 'Utilisateur'}
                                    </span>
                                    {message.isInternal && (
                                      <Badge variant="outline" className="text-xs border-yellow-500/30">
                                        Interne
                                      </Badge>
                                    )}
                                    <span className="text-xs text-gray-500">
                                      {formatRelativeTime(message.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-gray-300 whitespace-pre-wrap">{message.content}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="bg-gray-900/50 border-gray-700 p-8 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">Aucun message pour le moment</p>
                      </Card>
                    )}
                  </div>

                  {/* Activity Timeline */}
                  {selectedTicket.activities && selectedTicket.activities.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Historique</h3>
                      <div className="space-y-2">
                        {selectedTicket.activities.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-3 text-sm text-gray-400 pl-4 border-l-2 border-gray-700"
                          >
                            <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <p>
                                <span className="font-medium text-white">{activity.action}</span>
                                {activity.oldValue && activity.newValue && (
                                  <span>
                                    {' '}
                                    de <span className="text-gray-500">{activity.oldValue}</span> à{' '}
                                    <span className="text-white">{activity.newValue}</span>
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatRelativeTime(activity.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="flex-shrink-0 pt-4 border-t border-gray-700">
                <div className="flex gap-3">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez votre message..."
                    rows={3}
                    className="flex-1 bg-gray-900 border-gray-600 text-white resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSendMessage(selectedTicket.id);
                      }
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleSendMessage(selectedTicket.id)}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="icon" className="border-gray-600">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Appuyez sur Cmd/Ctrl + Entrée pour envoyer
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const MemoizedSupportPageContent = memo(SupportPageContent);

export default function SupportPage() {
  return (
    <ErrorBoundary level="page" componentName="SupportPage">
      <MemoizedSupportPageContent />
    </ErrorBoundary>
  );
}
