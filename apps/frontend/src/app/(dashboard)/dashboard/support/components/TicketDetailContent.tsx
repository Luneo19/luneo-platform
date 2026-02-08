'use client';

import { FileText, User, File, MessageSquare, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import type { Ticket, TicketMessage } from '@/lib/hooks/useSupport';
import type { SLA } from './types';
import { cn } from '@/lib/utils';

interface TicketDetailContentProps {
  ticket: Ticket;
  sla: SLA;
  formatRelativeTime: (date: Date | string) => string;
  onOpenTemplates: () => void;
}

export function TicketDetailContent({
  ticket,
  sla,
  formatRelativeTime,
  onOpenTemplates,
}: TicketDetailContentProps) {
  const messages = ticket.messages ?? [];
  const activities = ticket.activities ?? [];

  return (
    <ScrollArea className="flex-1 pr-4">
      <div className="space-y-6">
        {sla.status !== 'on-track' && (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">SLA</p>
                  <p className="text-xs text-gray-600">
                    Temps de résolution: {sla.resolutionTime.toFixed(1)}h restantes
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    sla.status === 'breached' && 'border-red-500 text-red-400',
                    sla.status === 'at-risk' && 'border-yellow-500 text-yellow-400'
                  )}
                >
                  {sla.status === 'breached' ? 'Dépassé' : 'À risque'}
                </Badge>
              </div>
              <Progress
                value={Math.max(0, Math.min(100, (sla.resolutionTime / 24) * 100))}
                className={cn(
                  'h-2 mt-2',
                  sla.status === 'breached' && 'bg-red-500/20',
                  sla.status === 'at-risk' && 'bg-yellow-500/20'
                )}
              />
            </CardContent>
          </Card>
        )}

        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-gray-900">Messages</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenTemplates}
              className="border-gray-200"
            >
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </Button>
          </div>
          {messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message: TicketMessage) => (
                <Card
                  key={message.id}
                  className={cn(
                    'bg-gray-50 border-gray-200',
                    message.isInternal && 'border-yellow-500/30 bg-yellow-500/5'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {message.author || 'Utilisateur'}
                          </span>
                          {message.isInternal && (
                            <Badge variant="outline" className="text-xs border-yellow-500/30">
                              Interne
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.attachments.map((attachment: { id: string; name: string }, i: number) => (
                              <Badge key={attachment.id ?? i} variant="outline" className="border-gray-200">
                                <File className="w-3 h-3 mr-1" />
                                {attachment.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-50 border-gray-200 p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucun message pour le moment</p>
            </Card>
          )}
        </div>

        {activities.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900">Historique</h3>
            <div className="space-y-2">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 text-sm text-gray-600 pl-4 border-l-2 border-gray-200"
                >
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>
                      <span className="font-medium text-gray-900">{activity.action || activity.description}</span>
                      {activity.oldValue && activity.newValue && (
                        <span>
                          {' '}
                          de <span className="text-gray-500">{activity.oldValue}</span> à{' '}
                          <span className="text-gray-900">{activity.newValue}</span>
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
