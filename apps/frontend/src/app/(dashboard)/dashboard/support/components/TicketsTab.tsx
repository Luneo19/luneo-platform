'use client';

import { Search, List, Grid, Plus, Archive, CheckCircle, User, Trash2, X } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { TicketIcon } from 'lucide-react';
import { TicketCard } from './TicketCard';
import { statusConfig, priorityConfig, categoryConfig } from './constants';
import type { Ticket } from '@/lib/hooks/useSupport';
import type { SLA } from './types';
import type { ViewMode } from './types';
import { cn } from '@/lib/utils';

interface TicketsTabProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterPriority: string;
  setFilterPriority: (v: string) => void;
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  filteredTickets: Ticket[];
  selectedTickets: Set<string>;
  setSelectedTickets: (v: Set<string>) => void;
  calculateSLA: (ticket: Ticket) => SLA;
  formatRelativeTime: (date: Date | string) => string;
  onViewTicket: (ticketId: string) => void;
  onSelectTicket: (ticketId: string) => void;
  onBulkAction: (action: 'archive' | 'close' | 'assign' | 'delete') => void;
  onNewTicket: () => void;
}

export function TicketsTab({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  filterCategory,
  setFilterCategory,
  viewMode,
  setViewMode,
  filteredTickets,
  selectedTickets,
  setSelectedTickets,
  calculateSLA,
  formatRelativeTime,
  onViewTicket,
  onSelectTicket,
  onBulkAction,
  onNewTicket,
}: TicketsTabProps) {
  const { t } = useI18n();
  const hasFilters =
    searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('support.searchTicket')}
            className="pl-10 bg-white border-gray-200 text-gray-900"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px] bg-white border-gray-200 text-gray-900">
            <SelectValue placeholder={t('support.status')} />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 text-gray-900">
            <SelectItem value="all">{t('support.allStatuses')}</SelectItem>
            <SelectItem value="OPEN">{t('support.statuses.open')}</SelectItem>
            <SelectItem value="IN_PROGRESS">{t('support.statuses.inProgress')}</SelectItem>
            <SelectItem value="WAITING_CUSTOMER">{t('support.statuses.waiting')}</SelectItem>
            <SelectItem value="RESOLVED">{t('support.statuses.resolved')}</SelectItem>
            <SelectItem value="CLOSED">{t('support.statuses.closed')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[180px] bg-white border-gray-200 text-gray-900">
            <SelectValue placeholder={t('support.priority')} />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 text-gray-900">
            <SelectItem value="all">{t('support.allPriorities')}</SelectItem>
            <SelectItem value="LOW">{t('support.priorities.low')}</SelectItem>
            <SelectItem value="MEDIUM">{t('support.priorities.medium')}</SelectItem>
            <SelectItem value="HIGH">{t('support.priorities.high')}</SelectItem>
            <SelectItem value="URGENT">{t('support.priorities.urgent')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px] bg-white border-gray-200 text-gray-900">
            <SelectValue placeholder={t('support.category')} />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 text-gray-900">
            <SelectItem value="all">{t('support.allCategories')}</SelectItem>
            <SelectItem value="BILLING">Facturation</SelectItem>
            <SelectItem value="TECHNICAL">Technique</SelectItem>
            <SelectItem value="ACCOUNT">Compte</SelectItem>
            <SelectItem value="FEATURE_REQUEST">Fonctionnalité</SelectItem>
            <SelectItem value="BUG">Bug</SelectItem>
            <SelectItem value="INTEGRATION">Intégration</SelectItem>
            <SelectItem value="OTHER">Autre</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="border-gray-200"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="border-gray-200"
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {selectedTickets.size > 0 && (
        <Card className="p-4 bg-cyan-950/20 border-cyan-500/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedTickets.size === filteredTickets.length}
                onCheckedChange={(checked) => {
                  if (checked) setSelectedTickets(new Set(filteredTickets.map((t) => t.id)));
                  else setSelectedTickets(new Set());
                }}
              />
              <span className="text-sm text-gray-700">{t('support.selectedCount', { count: selectedTickets.size })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onBulkAction('archive')} className="border-gray-200">
                <Archive className="w-4 h-4 mr-2" />
                {t('support.archive')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => onBulkAction('close')} className="border-gray-200">
                <CheckCircle className="w-4 h-4 mr-2" />
                {t('support.close')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => onBulkAction('assign')} className="border-gray-200">
                <User className="w-4 h-4 mr-2" />
                {t('support.assign')}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onBulkAction('delete')}>
                <Trash2 className="w-4 h-4 mr-2" />
                {t('common.delete')}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setSelectedTickets(new Set())} className="border-gray-200">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {filteredTickets.length === 0 ? (
        <Card className="p-12 bg-white border-gray-200 text-center">
          <TicketIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('support.noTickets')}</h3>
          <p className="text-gray-600 mb-4">
            {hasFilters
              ? t('support.noResultsSearch')
              : t('support.noTicketsYet')}
          </p>
          {!hasFilters && (
            <Button onClick={onNewTicket} variant="outline" className="border-gray-200">
              <Plus className="w-4 h-4 mr-2" />
              {t('support.createTicket')}
            </Button>
          )}
        </Card>
      ) : (
        <div
          className={cn(
            viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'
          )}
        >
          <AnimatePresence>
            {filteredTickets.map((ticket, index) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                index={index}
                sla={calculateSLA(ticket)}
                formatRelativeTime={formatRelativeTime}
                isSelected={selectedTickets.has(ticket.id)}
                hasSelectionMode={selectedTickets.size > 0}
                onSelect={onSelectTicket}
                onView={onViewTicket}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
