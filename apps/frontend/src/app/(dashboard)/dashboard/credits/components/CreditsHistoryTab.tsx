'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, formatRelativeDate } from '@/lib/utils/formatters';
import { TRANSACTION_TYPE_CONFIG, type TransactionTypeConfig } from './constants';
import type { CreditTransaction } from './types';

interface CreditsHistoryTabProps {
  filteredTransactions: CreditTransaction[];
  filterType: string;
  filterDateRange: string;
  onFilterTypeChange: (value: string) => void;
  onFilterDateRangeChange: (value: string) => void;
  onExport: () => void;
}

export function CreditsHistoryTab({
  filteredTransactions,
  filterType,
  filterDateRange,
  onFilterTypeChange,
  onFilterDateRangeChange,
  onExport,
}: CreditsHistoryTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <Select value={filterType} onValueChange={onFilterTypeChange}>
            <SelectTrigger className="w-[180px] bg-gray-900 border-gray-600 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {Object.entries(TRANSACTION_TYPE_CONFIG).map(([key, config]: [string, TransactionTypeConfig]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterDateRange} onValueChange={onFilterDateRangeChange}>
            <SelectTrigger className="w-[180px] bg-gray-900 border-gray-600 text-white">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les périodes</SelectItem>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onExport} className="border-gray-600">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Historique des transactions</CardTitle>
          <CardDescription className="text-gray-400">Toutes vos transactions de crédits</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Aucune transaction</h3>
              <p className="text-gray-400">
                {filterType !== 'all' || filterDateRange !== 'all'
                  ? 'Aucune transaction ne correspond à vos filtres'
                  : 'Votre historique de transactions apparaîtra ici'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Description</TableHead>
                  <TableHead className="text-gray-300">Montant</TableHead>
                  <TableHead className="text-gray-300">Solde après</TableHead>
                  <TableHead className="text-gray-300">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const config: TransactionTypeConfig = TRANSACTION_TYPE_CONFIG[transaction.type];
                  const Icon = config.icon;
                  return (
                    <TableRow key={transaction.id} className="border-gray-700 hover:bg-gray-800/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${config.color}`} />
                          </div>
                          <Badge variant="outline" className={cn('text-xs', config.bg, config.color)}>
                            {config.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {transaction.type === 'purchase' && transaction.packName
                              ? `Achat ${transaction.packName}`
                              : transaction.type === 'usage' && transaction.source
                                ? `Utilisation: ${transaction.source}`
                                : config.label}
                          </p>
                          {transaction.metadata && typeof transaction.metadata === 'object' && 'model' in transaction.metadata && (
                            <p className="text-xs text-gray-400">Modèle: {String((transaction.metadata as { model?: string }).model)}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-sm font-bold', transaction.amount > 0 ? 'text-green-400' : 'text-red-400')}>
                          {transaction.amount > 0 ? '+' : ''}{formatNumber(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-300">{formatNumber(transaction.balanceAfter)}</TableCell>
                      <TableCell className="text-gray-400 text-sm">{formatRelativeDate(transaction.createdAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
