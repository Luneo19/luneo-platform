'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, CheckCheck, Trash2, Settings, Filter,
  Info, AlertTriangle, CheckCircle, XCircle, Gift, Zap, Star, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promo' | 'feature' | 'achievement';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
  action_label?: string;
}

const typeConfig = {
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Information' },
  success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Succès' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Avertissement' },
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Erreur' },
  promo: { icon: Gift, color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Promotion' },
  feature: { icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: 'Nouveauté' },
  achievement: { icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Réussite' },
};

function NotificationsPageContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [showRead, setShowRead] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications || []);
      }
    } catch (error) {
      logger.error('Error loading notifications', { error });
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
    } catch (error) {
      logger.warn('Error marking all as read', { error });
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (error) {
      logger.warn('Error deleting notification', { error });
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    } catch (error) {
      logger.warn('Error marking as read', { error });
    }
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (!showRead && n.read) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-cyan-400" />
            Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-sm rounded-full">
                {unreadCount} non lues
              </span>
            )}
          </h1>
          <p className="text-gray-400 mt-1">Gérez vos notifications et alertes</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="border-gray-600"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
          <Link href="/dashboard/settings/notifications">
            <Button variant="outline" className="border-gray-600">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all">Tous les types</option>
            <option value="info">Informations</option>
            <option value="success">Succès</option>
            <option value="warning">Avertissements</option>
            <option value="error">Erreurs</option>
            <option value="promo">Promotions</option>
            <option value="feature">Nouveautés</option>
            <option value="achievement">Réussites</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showRead}
            onChange={(e) => setShowRead(e.target.checked)}
            className="rounded border-gray-600 bg-gray-800 text-cyan-500"
          />
          Afficher les notifications lues
        </label>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="p-12 bg-gray-800/50 border-gray-700 text-center">
          <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Aucune notification</h3>
          <p className="text-gray-400">
            {filterType !== 'all' || !showRead
              ? 'Aucune notification ne correspond à vos filtres'
              : 'Vous êtes à jour !'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification, index) => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className={`p-4 bg-gray-800/50 border-gray-700 ${
                    !notification.read ? 'border-l-4 border-l-cyan-500' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`font-medium ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                              {notification.title}
                            </h3>
                            <span className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">{formatDate(notification.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {notification.action_url && (
                            <Link
                              href={notification.action_url}
                              onClick={() => markAsRead(notification.id)}
                              className="px-3 py-1.5 bg-cyan-600/20 text-cyan-400 text-sm rounded-lg hover:bg-cyan-600/30"
                            >
                              {notification.action_label || 'Voir'}
                            </Link>
                          )}
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="text-gray-400 hover:text-white"
                            >
                              <CheckCheck className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
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
