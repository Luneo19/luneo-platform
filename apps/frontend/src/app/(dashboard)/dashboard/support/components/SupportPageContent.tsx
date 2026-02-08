'use client';

import React, { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupportPage } from './useSupportPage';
import { RESPONSE_TEMPLATES } from './constants';
import {
  SupportHeader,
  SupportStatsCards,
  SupportSlaAlerts,
  TicketsTab,
  KnowledgeTab,
  TemplatesTab,
  AnalyticsTab,
  NewTicketDialog,
  TicketDetailDialog,
  TemplateDialog,
  CsatDialog,
  ExportDialog,
  SupportFeatureSections,
  SupportFeatureSectionsExtended,
} from './index';

function SupportPageContentInner() {
  const support = useSupportPage();
  const {
    tickets,
    selectedTicket,
    stats,
    loading,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    filteredTickets,
    filteredKB,
    showNewTicket,
    showTicketDetail,
    showTemplateDialog,
    showCSATDialog,
    showExportDialog,
    activeTab,
    setActiveTab,
    newTicket,
    setNewTicket,
    newMessage,
    setNewMessage,
    sendingMessage,
    csatRating,
    setCsatRating,
    csatComment,
    setCsatComment,
    calculateSLA,
    formatDate,
    formatRelativeTime,
    handleCreateTicket,
    handleViewTicket,
    handleSendMessage,
    handleUpdateStatus,
    handleUpdatePriority,
    handleUseTemplate,
    handleSubmitCSAT,
    handleSelectTicket,
    handleBulkAction,
    setShowTemplateDialog,
    setShowCSATDialog,
  } = support;

  const slaForSelected = selectedTicket ? calculateSLA(selectedTicket) : null;

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-700">Chargement des tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <SupportHeader
        onRefresh={support.fetchTickets}
        onExport={() => support.setShowExportDialog(true)}
        onNewTicket={() => support.setShowNewTicket(true)}
      />
      <SupportStatsCards
        ticketsLength={tickets.length}
        stats={stats}
        openCount={openTickets.length}
        inProgressCount={inProgressTickets.length}
        resolvedCount={resolvedTickets.length}
        pendingCount={tickets.filter((t) => t.status === 'pending').length}
        urgentCount={tickets.filter((t) => t.priority === 'high').length}
      />
      <SupportSlaAlerts tickets={tickets} calculateSLA={calculateSLA} onViewTicket={handleViewTicket} />

      <Tabs value={activeTab} onValueChange={(v) => support.setActiveTab(v as 'tickets' | 'knowledge' | 'templates' | 'analytics')} className="space-y-6">
        <TabsList className="bg-gray-50 border-gray-200">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-cyan-600">Tickets ({tickets.length})</TabsTrigger>
          <TabsTrigger value="knowledge" className="data-[state=active]:bg-cyan-600">Base de connaissances ({support.knowledgeBase.length})</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-cyan-600">Templates ({RESPONSE_TEMPLATES.length})</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-600">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="tickets" className="space-y-6">
          <TicketsTab
            searchTerm={support.searchTerm}
            setSearchTerm={support.setSearchTerm}
            filterStatus={support.filterStatus}
            setFilterStatus={support.setFilterStatus}
            filterPriority={support.filterPriority}
            setFilterPriority={support.setFilterPriority}
            filterCategory={support.filterCategory}
            setFilterCategory={support.setFilterCategory}
            viewMode={support.viewMode}
            setViewMode={support.setViewMode}
            filteredTickets={filteredTickets}
            selectedTickets={support.selectedTickets}
            setSelectedTickets={support.setSelectedTickets}
            calculateSLA={calculateSLA}
            formatRelativeTime={formatRelativeTime}
            onViewTicket={handleViewTicket}
            onSelectTicket={handleSelectTicket}
            onBulkAction={handleBulkAction}
            onNewTicket={() => support.setShowNewTicket(true)}
          />
        </TabsContent>
        <TabsContent value="knowledge" className="space-y-6">
          <KnowledgeTab kbSearch={support.kbSearch} setKbSearch={support.setKbSearch} filteredKB={filteredKB} />
        </TabsContent>
        <TabsContent value="templates" className="space-y-6">
          <TemplatesTab
            onPreview={(t) => { support.setSelectedTemplate(t); setShowTemplateDialog(true); }}
            onUseTemplate={handleUseTemplate}
          />
        </TabsContent>
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>

      <NewTicketDialog open={showNewTicket} onOpenChange={support.setShowNewTicket} newTicket={newTicket} setNewTicket={setNewTicket} onSubmit={handleCreateTicket} />
      <TicketDetailDialog
        open={showTicketDetail}
        onOpenChange={support.setShowTicketDetail}
        ticket={selectedTicket}
        sla={slaForSelected}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        sendingMessage={sendingMessage}
        formatDate={formatDate}
        formatRelativeTime={formatRelativeTime}
        onUpdateStatus={handleUpdateStatus}
        onUpdatePriority={handleUpdatePriority}
        onSendMessage={handleSendMessage}
        onOpenCSAT={() => setShowCSATDialog(true)}
        onOpenTemplates={() => setShowTemplateDialog(true)}
      />
      <TemplateDialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog} onUseTemplate={handleUseTemplate} />
      <CsatDialog open={showCSATDialog} onOpenChange={setShowCSATDialog} rating={csatRating} setRating={setCsatRating} comment={csatComment} setComment={setCsatComment} onSubmit={handleSubmitCSAT} ticketId={selectedTicket?.id ?? null} />
      <ExportDialog open={showExportDialog} onOpenChange={support.setShowExportDialog} filterStatus={support.filterStatus} filterPriority={support.filterPriority} filterCategory={support.filterCategory} onExport={() => { support.toast({ title: 'Export', description: 'Export en cours...' }); support.setShowExportDialog(false); }} />

      <SupportFeatureSections />
      <SupportFeatureSectionsExtended />
    </div>
  );
}

export const SupportPageContent = memo(SupportPageContentInner);
