'use client';

/**
 * Page Notifications - Refactorée avec composants dans ./components/
 */

import { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotificationsPage } from './hooks/useNotificationsPage';
import { NotificationsHeader } from './components/NotificationsHeader';
import { NotificationsStatsGrid } from './components/NotificationsStatsGrid';
import { NotificationsFiltersBar } from './components/NotificationsFiltersBar';
import { NotificationsListSection } from './components/NotificationsListSection';
import { NotificationsPreferencesTab } from './components/NotificationsPreferencesTab';
import { NotificationsModals } from './components/NotificationsModals';

function NotificationsPageContent() {
  const s = useNotificationsPage();

  if (s.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto" />
          <p className="mt-4 text-gray-700">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <NotificationsHeader
        unreadCount={s.stats.unread}
        selectedCount={s.selectedNotifications.size}
        onBulkMarkRead={() => s.handleBulkAction('read')}
        onBulkDelete={() => s.handleBulkAction('delete')}
        onMarkAllAsRead={s.handleMarkAllAsRead}
        onOpenPreferences={() => s.setShowPreferencesModal(true)}
        onOpenExport={() => s.setShowExportModal(true)}
      />
      <NotificationsStatsGrid stats={s.stats} />
      <Tabs value={s.activeTab} onValueChange={(v) => s.setActiveTab(v as typeof s.activeTab)} className="space-y-6">
        <TabsList className="bg-white/50 border border-gray-200">
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-600">Toutes ({s.stats.total})</TabsTrigger>
          <TabsTrigger value="unread" className="data-[state=active]:bg-cyan-600">Non lues ({s.stats.unread})</TabsTrigger>
          <TabsTrigger value="archived" className="data-[state=active]:bg-cyan-600">Archivées ({s.stats.archived})</TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-cyan-600">Préférences</TabsTrigger>
        </TabsList>

        {(s.activeTab === 'all' || s.activeTab === 'unread' || s.activeTab === 'archived') && (
          <TabsContent value={s.activeTab} className="space-y-6">
            <NotificationsFiltersBar
              searchTerm={s.searchTerm}
              onSearchChange={s.setSearchTerm}
              filterType={s.filterType}
              onFilterTypeChange={s.setFilterType}
              filterPriority={s.filterPriority}
              onFilterPriorityChange={s.setFilterPriority}
              filterStatus={s.filterStatus}
              onFilterStatusChange={s.setFilterStatus}
              viewMode={s.viewMode}
              onViewModeToggle={() => s.setViewMode(s.viewMode === 'list' ? 'grid' : 'list')}
              groupByDate={s.groupByDate}
              onGroupByDateToggle={() => s.setGroupByDate(!s.groupByDate)}
            />
            <NotificationsListSection
              loading={false}
              filteredNotifications={s.filteredNotifications}
              groupedNotifications={s.groupedNotifications}
              groupByDate={s.groupByDate}
              selectedNotifications={s.selectedNotifications}
              searchTerm={s.searchTerm}
              filterType={s.filterType}
              filterPriority={s.filterPriority}
              filterStatus={s.filterStatus}
              onToggleSelect={s.handleToggleSelect}
              onSelectAll={s.handleSelectAll}
              onBulkMarkRead={() => s.handleBulkAction('read')}
              onBulkDelete={() => s.handleBulkAction('delete')}
              onMarkAsRead={s.handleMarkAsRead}
              onDelete={s.handleDelete}
            />
          </TabsContent>
        )}

        <TabsContent value="preferences" className="space-y-6">
          <NotificationsPreferencesTab preferences={s.preferences} setPreferences={s.setPreferences} onSave={s.handleUpdatePreferences} />
        </TabsContent>
      </Tabs>

      <NotificationsModals
        showPreferencesModal={s.showPreferencesModal}
        setShowPreferencesModal={s.setShowPreferencesModal}
        preferences={s.preferences}
        setPreferences={s.setPreferences}
        onUpdatePreferences={s.handleUpdatePreferences}
        showExportModal={s.showExportModal}
        setShowExportModal={s.setShowExportModal}
        filteredNotifications={s.filteredNotifications}
      />
    </div>
  );
}

const MemoizedNotificationsPageContent = memo(NotificationsPageContent);

export default function NotificationsPage() {
  return (
    <ErrorBoundary level="page" componentName="NotificationsPage">
      <MemoizedNotificationsPageContent />
    </ErrorBoundary>
  );
}
