'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { LazyMotionDiv as Motion } from '@/lib/performance/dynamic-motion';
import {
  TicketIcon, Plus, Search, Clock,
  MessageSquare, ChevronRight, Loader2, Send, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  updated_at: string;
  messages_count: number;
}

const statusConfig = {
  open: { label: 'Ouvert', color: 'bg-blue-500', textColor: 'text-blue-500' },
  in_progress: { label: 'En cours', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  resolved: { label: 'Résolu', color: 'bg-green-500', textColor: 'text-green-500' },
  closed: { label: 'Fermé', color: 'bg-muted-foreground', textColor: 'text-muted-foreground' },
};

const priorityConfig = {
  low: { label: 'Basse', color: 'border-gray-500' },
  medium: { label: 'Moyenne', color: 'border-blue-500' },
  high: { label: 'Haute', color: 'border-orange-500' },
  urgent: { label: 'Urgente', color: 'border-red-500' },
};

const categories = [
  { id: 'billing', label: 'Facturation' },
  { id: 'technical', label: 'Technique' },
  { id: 'account', label: 'Compte' },
  { id: 'feature', label: 'Fonctionnalité' },
  { id: 'bug', label: 'Bug' },
  { id: 'other', label: 'Autre' },
];

const SUPPORT_MODULE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SUPPORT_MODULE !== 'false';

function SupportPageContent() {
  const [supportModuleUnavailable, setSupportModuleUnavailable] = useState(!SUPPORT_MODULE_ENABLED);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newTicket, setNewTicket] = useState<{
    subject: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }>({
    subject: '',
    description: '',
    category: 'technical',
    priority: 'medium',
  });

  useEffect(() => {
    if (SUPPORT_MODULE_ENABLED) {
      loadTickets();
    } else {
      setLoading(false);
    }
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ success?: boolean; data?: { tickets?: Ticket[] }; tickets?: Ticket[] }>('/api/v1/support/tickets');
      const ticketsList = data?.data?.tickets ?? data?.tickets ?? [];
      if (data && 'success' in data && data.success) {
        setTickets(ticketsList);
      } else {
        setTickets(ticketsList);
      }
      setSupportModuleUnavailable(false);
    } catch (error) {
      logger.error('Error loading tickets', { error });
      setSupportModuleUnavailable(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = await api.post<{ success?: boolean; data?: { ticket?: Ticket }; ticket?: Ticket }>('/api/v1/support/tickets', newTicket);
      const ticket = data?.data?.ticket ?? data?.ticket;
      if (ticket) {
        setTickets([ticket, ...tickets]);
        setShowNewTicket(false);
        setNewTicket({
          subject: '',
          description: '',
          category: 'technical',
          priority: 'medium',
        });
      }
      setSupportModuleUnavailable(false);
    } catch (error) {
      logger.error('Error creating ticket', { error });
      setSupportModuleUnavailable(true);
    } finally {
      setSubmitting(false);
    }
  }, [newTicket, tickets]);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
            <TicketIcon className="w-8 h-8 text-cyan-400" />
            Support
          </h1>
          <p className="text-muted-foreground mt-1">Gerez vos tickets et demandes d'assistance</p>
        </div>
        <Button
          onClick={() => setShowNewTicket(true)}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau ticket
        </Button>
      </div>

      {supportModuleUnavailable && (
        <Card className="p-4 bg-amber-500/10 border-amber-500/30">
          <p className="text-amber-300 text-sm">
            Le module support est temporairement indisponible pendant la migration API.
          </p>
        </Card>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un ticket..."
            className="pl-10 bg-background border-border text-foreground"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-background border border-border rounded-lg text-foreground"
        >
          <option value="all">Tous les statuts</option>
          <option value="open">Ouverts</option>
          <option value="in_progress">En cours</option>
          <option value="resolved">Résolus</option>
          <option value="closed">Fermés</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: tickets.length, colorClass: 'text-cyan-500' },
          { label: 'Ouverts', value: tickets.filter(t => t.status === 'open').length, colorClass: 'text-blue-500' },
          { label: 'En cours', value: tickets.filter(t => t.status === 'in_progress').length, colorClass: 'text-yellow-500' },
          { label: 'Resolus', value: tickets.filter(t => t.status === 'resolved').length, colorClass: 'text-green-500' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 bg-card border-border">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.colorClass}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card className="p-12 bg-card border-border text-center">
          <TicketIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Aucun ticket</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Aucun résultat pour votre recherche' : 'Vous n\'avez pas encore créé de ticket'}
          </p>
          <Button onClick={() => setShowNewTicket(true)} variant="outline" className="border-gray-600">
            <Plus className="w-4 h-4 mr-2" />
            Créer un ticket
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket, index) => (
            <Motion
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`p-4 bg-card border-border hover:border-muted-foreground/40 transition-colors cursor-pointer border-l-4 ${priorityConfig[ticket.priority].color}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig[ticket.status].color} text-white`}>
                        {statusConfig[ticket.status].label}
                      </span>
                      <span className="text-xs text-muted-foreground">#{ticket.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="font-semibold text-foreground truncate">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{ticket.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {ticket.messages_count} messages
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>
            </Motion>
          ))}
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Motion
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Nouveau ticket</h2>
              <button onClick={() => setShowNewTicket(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Sujet</label>
                <Input
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Décrivez brièvement votre problème"
                  className="bg-background border-border text-foreground"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Categorie</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Priorite</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Décrivez votre problème en détail..."
                  rows={5}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewTicket(false)}
                  className="flex-1 border-border"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Créer le ticket
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Motion>
        </div>
      )}
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

