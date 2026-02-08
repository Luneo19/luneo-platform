'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPrice, formatRelativeDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG } from '../constants';
import type { Referral } from '../types';

interface ReferralsTabProps {
  referrals: Referral[];
  filterStatus: string;
  onFilterChange: (value: string) => void;
}

export function ReferralsTab({ referrals, filterStatus, onFilterChange }: ReferralsTabProps) {
  const filtered = referrals.filter((r) => filterStatus === 'all' || r.status === filterStatus);

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Référents</CardTitle>
            <CardDescription className="text-gray-600">Liste de tous vos référents</CardDescription>
          </div>
          <Select value={filterStatus} onValueChange={onFilterChange}>
            <SelectTrigger className="w-[180px] bg-gray-900 border-gray-200 text-white">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead className="text-gray-700">Référent</TableHead>
              <TableHead className="text-gray-700">Statut</TableHead>
              <TableHead className="text-gray-700">Date inscription</TableHead>
              <TableHead className="text-gray-700">Revenus</TableHead>
              <TableHead className="text-gray-700">Commission</TableHead>
              <TableHead className="text-gray-700">Lien</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((referral) => {
              const config = STATUS_CONFIG[referral.status as keyof typeof STATUS_CONFIG];
              const Icon = config?.icon;
              if (!Icon) return null;
              return (
                <TableRow key={referral.id} className="border-gray-200 hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-white">{referral.name || referral.email}</p>
                      <p className="text-xs text-gray-600">{referral.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-xs', config.bg, config.color)}>
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700 text-sm">
                    {formatRelativeDate(referral.signupDate)}
                  </TableCell>
                  <TableCell className="text-white font-medium">{formatPrice(referral.revenue)}</TableCell>
                  <TableCell className="text-green-400 font-medium">{formatPrice(referral.commission)}</TableCell>
                  <TableCell>
                    <code className="text-xs text-gray-600">{referral.linkCode}</code>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
