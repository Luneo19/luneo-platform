'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPrice, formatRelativeDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG } from '../constants';
import type { Commission } from '../types';

interface CommissionsTabProps {
  commissions: Commission[];
}

export function CommissionsTab({ commissions }: CommissionsTabProps) {
  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900">Historique des commissions</CardTitle>
        <CardDescription className="text-gray-400">Toutes vos commissions et paiements</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead className="text-gray-700">Référent</TableHead>
              <TableHead className="text-gray-700">Montant</TableHead>
              <TableHead className="text-gray-700">Statut</TableHead>
              <TableHead className="text-gray-700">Date</TableHead>
              <TableHead className="text-gray-700">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.map((commission) => {
              const config = STATUS_CONFIG[commission.status as keyof typeof STATUS_CONFIG];
              const Icon = config?.icon;
              if (!Icon) return null;
              return (
                <TableRow key={commission.id} className="border-gray-200 hover:bg-gray-50">
                  <TableCell className="text-gray-900">{commission.referralEmail}</TableCell>
                  <TableCell className="text-green-400 font-bold">{formatPrice(commission.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-xs', config.bg, config.color)}>
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700 text-sm">
                    {formatRelativeDate(commission.createdAt)}
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">{commission.description}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
