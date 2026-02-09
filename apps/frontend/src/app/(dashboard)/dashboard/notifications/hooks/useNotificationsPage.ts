'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/lib/trpc/client';
import type { Notification, NotificationStats, NotificationPreferences, NotificationsTab } from '../components/types';

const DEFAULT_PREFS: NotificationPreferences = {
  email: { orders: true, customizations: true, system: true, marketing: false },
  push: { orders: true, customizations: true, system: false },
  inApp: { orders: true, customizations: true, system: true },
  sound: true,
  doNotDisturb: { enabled: false },
};

export function useNotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<NotificationsTab>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [groupByDate, setGroupByDate] = useState(true);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, read: 0, archived: 0, byType: {}, byPriority: {}, readRate: 0, avgReadTime: 0 });
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFS);

  const notificationsQuery = trpc.notification.list.useQuery({ unreadOnly: activeTab === 'unread', limit: 100, offset: 0 });
  const preferencesQuery = trpc.notification.getPreferences.useQuery();
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({ onSuccess: () => { notificationsQuery.refetch(); toast({ title: 'Succès', description: 'Notification marquée comme lue' }); } });
  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({ onSuccess: () => { notificationsQuery.refetch(); toast({ title: 'Succès', description: 'Toutes les notifications marquées comme lues' }); } });
  const deleteMutation = trpc.notification.delete.useMutation({ onSuccess: () => { notificationsQuery.refetch(); toast({ title: 'Succès', description: 'Notification supprimée' }); } });
  const updatePreferencesMutation = trpc.notification.updatePreferences.useMutation({ onSuccess: () => { preferencesQuery.refetch(); toast({ title: 'Succès', description: 'Préférences mises à jour' }); } });

  const allNotifications: Notification[] = useMemo(() => {
    return (notificationsQuery.data?.notifications || []).map((n: Record<string, unknown>) => {
      const createdRaw = n.createdAt ?? n.created_at;
      const readAtRaw = n.readAt ?? n.read_at;
      const actionUrlRaw = n.actionUrl ?? n.action_url;
      const actionLabelRaw = n.actionLabel ?? n.action_label;
      const metadataRaw = n.data ?? n.metadata;
      const resourceTypeRaw = n.resourceType ?? n.resource_type;
      const resourceIdRaw = n.resourceId ?? n.resource_id;
      return {
        id: String(n.id),
        type: (n.type ?? 'info') as Notification['type'],
        title: String(n.title ?? ''),
        message: String(n.message ?? ''),
        read: Boolean(n.read ?? n.is_read),
        archived: Boolean(n.archived ?? n.is_archived),
        priority: (n.priority ?? 'normal') as Notification['priority'],
        created_at: typeof createdRaw === 'string' ? createdRaw : new Date().toISOString(),
        read_at: typeof readAtRaw === 'string' ? readAtRaw : undefined,
        action_url: typeof actionUrlRaw === 'string' ? actionUrlRaw : undefined,
        action_label: typeof actionLabelRaw === 'string' ? actionLabelRaw : undefined,
        metadata: metadataRaw != null && typeof metadataRaw === 'object' && !Array.isArray(metadataRaw) ? (metadataRaw as Record<string, unknown>) : undefined,
        resource_type: typeof resourceTypeRaw === 'string' ? resourceTypeRaw : undefined,
        resource_id: typeof resourceIdRaw === 'string' ? resourceIdRaw : undefined,
      };
    });
  }, [notificationsQuery.data]);

  useEffect(() => {
    if (preferencesQuery.data) setPreferences((preferencesQuery.data as NotificationPreferences) ?? DEFAULT_PREFS);
  }, [preferencesQuery.data]);

  useEffect(() => {
    const total = allNotifications.length;
    const unread = allNotifications.filter((n) => !n.read && !n.archived).length;
    const read = allNotifications.filter((n) => n.read && !n.archived).length;
    const archived = allNotifications.filter((n) => n.archived).length;
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    allNotifications.forEach((n) => { byType[n.type] = (byType[n.type] || 0) + 1; byPriority[n.priority] = (byPriority[n.priority] || 0) + 1; });
    const readRate = total > 0 ? (read / total) * 100 : 0;
    const readWithTime = allNotifications.filter((n) => n.read && n.read_at && n.created_at);
    const avgReadTime = readWithTime.length === 0 ? 0 : Math.round(readWithTime.reduce((sum, n) => sum + new Date(n.read_at!).getTime() - new Date(n.created_at).getTime(), 0) / readWithTime.length / 1000);
    setStats({ total, unread, read, archived, byType, byPriority, readRate, avgReadTime });
  }, [allNotifications]);

  const filteredNotifications = useMemo(() => {
    let filtered = allNotifications;
    if (activeTab === 'unread') filtered = filtered.filter((n) => !n.read && !n.archived);
    else if (activeTab === 'archived') filtered = filtered.filter((n) => n.archived);
    else filtered = filtered.filter((n) => !n.archived);
    if (filterType !== 'all') filtered = filtered.filter((n) => n.type === filterType);
    if (filterPriority !== 'all') filtered = filtered.filter((n) => n.priority === filterPriority);
    if (filterStatus === 'read') filtered = filtered.filter((n) => n.read);
    else if (filterStatus === 'unread') filtered = filtered.filter((n) => !n.read);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter((n) => n.title.toLowerCase().includes(s) || n.message.toLowerCase().includes(s));
    }
    return filtered;
  }, [allNotifications, activeTab, filterType, filterPriority, filterStatus, searchTerm]);

  const groupedNotifications = useMemo(() => {
    if (!groupByDate) return { 'Toutes': filteredNotifications };
    const groups: Record<string, Notification[]> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today); thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today); thisMonth.setMonth(thisMonth.getMonth() - 1);
    filteredNotifications.forEach((n) => {
      const d = new Date(n.created_at);
      let key = 'Plus ancien';
      if (d >= today) key = "Aujourd'hui";
      else if (d >= yesterday) key = 'Hier';
      else if (d >= thisWeek) key = 'Cette semaine';
      else if (d >= thisMonth) key = 'Ce mois';
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });
    return groups;
  }, [filteredNotifications, groupByDate]);

  const handleMarkAsRead = useCallback((id: string) => markAsReadMutation.mutate({ id }), [markAsReadMutation]);
  const handleMarkAllAsRead = useCallback(() => markAllAsReadMutation.mutate(), [markAllAsReadMutation]);
  const handleDelete = useCallback((id: string) => deleteMutation.mutate({ id }), [deleteMutation]);
  const handleBulkAction = useCallback((action: 'read' | 'delete') => {
    if (selectedNotifications.size === 0) { toast({ title: 'Erreur', description: 'Aucune notification sélectionnée', variant: 'destructive' }); return; }
    selectedNotifications.forEach((id) => action === 'read' ? handleMarkAsRead(id) : handleDelete(id));
    setSelectedNotifications(new Set());
  }, [selectedNotifications, handleMarkAsRead, handleDelete, toast]);
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedNotifications((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const handleSelectAll = useCallback(() => {
    if (selectedNotifications.size === filteredNotifications.length) setSelectedNotifications(new Set());
    else setSelectedNotifications(new Set(filteredNotifications.map((n) => n.id)));
  }, [filteredNotifications, selectedNotifications]);
  const handleUpdatePreferences = useCallback(() => {
    updatePreferencesMutation.mutate(preferences);
    setShowPreferencesModal(false);
  }, [preferences, updatePreferencesMutation]);

  const loading = notificationsQuery.isLoading || preferencesQuery.isLoading;

  return {
    loading,
    stats,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterPriority,
    setFilterPriority,
    filterStatus,
    setFilterStatus,
    viewMode,
    setViewMode,
    groupByDate,
    setGroupByDate,
    filteredNotifications,
    groupedNotifications,
    selectedNotifications,
    handleToggleSelect,
    handleSelectAll,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
    handleBulkAction,
    preferences,
    setPreferences,
    showPreferencesModal,
    setShowPreferencesModal,
    showExportModal,
    setShowExportModal,
    handleUpdatePreferences,
    router,
  };
}
