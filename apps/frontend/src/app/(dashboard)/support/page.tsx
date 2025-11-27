'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TicketIcon, Plus, Search, Filter, Clock, CheckCircle, AlertCircle,
  MessageSquare, ChevronRight, Loader2, Send, Paperclip, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';

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
  open: { label: 'Ouvert', color: 'bg-blue-500', textColor: 'text-blue-400' },
  in_progress: { label: 'En cours', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  resolved: { label: 'Résolu', color: 'bg-green-500', textColor: 'text-green-400' },
  closed: { label: 'Fermé', color: 'bg-gray-500', textColor: 'text-gray-400' },
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

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'technical',
    priority: 'medium' as const,
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/support/tickets');
      const data = await response.json();

      if (data.success) {
        setTickets(data.data.tickets || []);
      }
    } catch (error) {
      logger.error('Error loading tickets', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      });

      const data = await response.json();

      if (data.success) {
        setTickets([data.data.ticket, ...tickets]);
        setShowNewTicket(false);
        setNewTicket({
          subject: '',
          description: '',
          category: 'technical',
          priority: 'medium',
        });
      }
    } catch (error) {
      logger.error('Error creating ticket', { error });
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <TicketIcon className="w-8 h-8 text-cyan-400" />
            Support
          </h1>
          <p className="text-gray-400 mt-1">Gérez vos tickets et demandes d'assistance</p>
        </div>
        <Button
          onClick={() => setShowNewTicket(true)}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau ticket
        </Button>
      </div>

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
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
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
          { label: 'Total', value: tickets.length, color: 'cyan' },
          { label: 'Ouverts', value: tickets.filter(t => t.status === 'open').length, color: 'blue' },
          { label: 'En cours', value: tickets.filter(t => t.status === 'in_progress').length, color: 'yellow' },
          { label: 'Résolus', value: tickets.filter(t => t.status === 'resolved').length, color: 'green' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 bg-gray-800/50 border-gray-700">
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card className="p-12 bg-gray-800/50 border-gray-700 text-center">
          <TicketIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Aucun ticket</h3>
          <p className="text-gray-400 mb-4">
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
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`p-4 bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer border-l-4 ${priorityConfig[ticket.priority].color}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig[ticket.status].color} text-white`}>
                        {statusConfig[ticket.status].label}
                      </span>
                      <span className="text-xs text-gray-500">#{ticket.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="font-semibold text-white truncate">{ticket.subject}</h3>
                    <p className="text-sm text-gray-400 line-clamp-1 mt-1">{ticket.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
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
                  <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-gray-800 rounded-2xl border border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Nouveau ticket</h2>
              <button onClick={() => setShowNewTicket(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sujet</label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Catégorie</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priorité</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Décrivez votre problème en détail..."
                  rows={5}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 resize-none"
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
          </motion.div>
        </div>
      )}
    </div>
  );
}

