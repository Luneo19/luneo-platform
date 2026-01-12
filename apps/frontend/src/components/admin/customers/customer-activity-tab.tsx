/**
 * ★★★ CUSTOMER ACTIVITY TAB ★★★
 * Tab Activity avec timeline des activités du customer
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, User, ShoppingCart, Mail, Settings } from 'lucide-react';
import type { CustomerActivity } from '@/hooks/admin/use-customer-detail';
import { formatRelativeTime } from '@/lib/utils';

export interface CustomerActivityTabProps {
  activities: CustomerActivity[];
}

const activityIcons: Record<string, React.ReactNode> = {
  'user.created': <User className="w-4 h-4 text-blue-500" />,
  'subscription.created': <ShoppingCart className="w-4 h-4 text-green-500" />,
  'subscription.updated': <ShoppingCart className="w-4 h-4 text-yellow-500" />,
  'email.sent': <Mail className="w-4 h-4 text-purple-500" />,
  'settings.updated': <Settings className="w-4 h-4 text-gray-500" />,
  default: <Activity className="w-4 h-4 text-zinc-500" />,
};

export function CustomerActivityTab({ activities }: CustomerActivityTabProps) {
  if (activities.length === 0) {
    return (
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="p-8 text-center text-zinc-500">
          No activity found for this customer.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-6 space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 pb-4 border-b border-zinc-700 last:border-0"
              >
                <div className="flex-shrink-0 mt-1">
                  {activityIcons[activity.type] || activityIcons.default}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{activity.action}</p>
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <p className="text-sm text-zinc-400 mt-1">
                      {JSON.stringify(activity.metadata, null, 2)}
                    </p>
                  )}
                  <p className="text-xs text-zinc-500 mt-2">
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
