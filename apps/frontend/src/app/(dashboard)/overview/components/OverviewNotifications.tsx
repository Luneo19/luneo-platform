'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-yellow-400" />;
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
    <Card className="p-5 bg-slate-900/50 border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-yellow-400" />
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
          className="text-slate-400 hover:text-white"
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
              className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                notification.read
                  ? 'bg-slate-800/30 border-slate-800 hover:bg-slate-800/50'
                  : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${notification.read ? 'text-slate-400' : 'text-white'}`}
                  >
                    {notification.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{notification.message}</p>
                </div>
                <span className="text-xs text-slate-600 flex-shrink-0">{notification.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </Card>
  );
}
