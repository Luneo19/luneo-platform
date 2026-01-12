/**
 * ★★★ CUSTOMER EMAILS TAB ★★★
 * Tab Emails avec historique des emails envoyés
 */

'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle, XCircle, Clock } from 'lucide-react';

export interface CustomerEmailsTabProps {
  emailHistory: Array<{
    id: string;
    subject: string;
    status: string;
    sentAt: Date | string;
  }>;
}

const statusIcons: Record<string, React.ReactNode> = {
  sent: <CheckCircle className="w-4 h-4 text-green-400" />,
  delivered: <CheckCircle className="w-4 h-4 text-green-400" />,
  opened: <Mail className="w-4 h-4 text-blue-400" />,
  clicked: <Mail className="w-4 h-4 text-purple-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
  pending: <Clock className="w-4 h-4 text-yellow-400" />,
};

const statusColors: Record<string, string> = {
  sent: 'bg-green-500/20 text-green-400',
  delivered: 'bg-green-500/20 text-green-400',
  opened: 'bg-blue-500/20 text-blue-400',
  clicked: 'bg-purple-500/20 text-purple-400',
  failed: 'bg-red-500/20 text-red-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
};

export function CustomerEmailsTab({ emailHistory }: CustomerEmailsTabProps) {
  if (emailHistory.length === 0) {
    return (
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="p-8 text-center text-zinc-500">
          No email history found for this customer.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-700">
              <TableHead className="text-zinc-400">Subject</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Sent At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emailHistory.map((email) => (
              <TableRow key={email.id} className="border-zinc-700">
                <TableCell className="text-white">{email.subject}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {statusIcons[email.status] || statusIcons.pending}
                    <Badge
                      variant="secondary"
                      className={statusColors[email.status] || 'bg-zinc-500/20 text-zinc-400'}
                    >
                      {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-zinc-400">
                  {new Date(email.sentAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
