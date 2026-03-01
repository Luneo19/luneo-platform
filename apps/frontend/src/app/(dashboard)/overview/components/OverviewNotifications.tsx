'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type NotificationItem = {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
};

function getNotificationIcon(type: NotificationItem['type']) {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-amber-400" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    default:
      return <Info className="w-5 h-5 text-blue-400" />;
  }
}

export function OverviewNotifications({
  notifications,
  showAll,
  onToggleShowAll,
}: {
  notifications: NotificationItem[];
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  const displayed = showAll ? notifications : notifications.slice(0, 3);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="dash-card rounded-2xl p-5 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-400" />
          Notifications
          {unreadCount > 0 && (
            <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/70 hover:text-white hover:bg-white/[0.04]"
          onClick={onToggleShowAll}
        >
          {showAll ? 'Moins' : 'Tout'}
        </Button>
      </div>
      <AnimatePresence>
        <div className="space-y-2">
          {displayed.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className={`p-3 rounded-lg border border-white/[0.06] transition-colors cursor-pointer ${
                notification.read
                  ? 'bg-white/[0.02] hover:bg-white/[0.04]'
                  : 'bg-white/[0.04] hover:bg-white/[0.06] border-purple-500/20'
              }`}
            >
              <div className="flex items-start gap-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${notification.read ? 'text-white/70' : 'text-white'}`}
                  >
                    {notification.title}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5 truncate">{notification.message}</p>
                </div>
                <span className="text-xs text-white/30 flex-shrink-0">{notification.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
