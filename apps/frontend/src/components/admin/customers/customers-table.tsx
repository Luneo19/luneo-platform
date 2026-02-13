/**
 * ★★★ CUSTOMERS TABLE ★★★
 * Table complète pour la gestion des customers
 * Avec multi-selection, bulk actions, search, filtres, tri, pagination
 */

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Mail,
  Download,
  Users,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import type { Customer } from '@/hooks/admin/use-customers';

export interface CustomersTableProps {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading?: boolean;
  filters: {
    status?: string;
    plan?: string;
    segment?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
  onFiltersChange: (filters: Partial<CustomersTableProps['filters']>) => void;
  onPageChange: (page: number) => void;
  className?: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  trial: 'bg-blue-500/20 text-blue-400',
  churned: 'bg-red-500/20 text-red-400',
  'at-risk': 'bg-yellow-500/20 text-yellow-400',
  none: 'bg-zinc-500/20 text-zinc-400',
};

const churnRiskColors: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

export function CustomersTable({
  customers,
  pagination,
  isLoading = false,
  filters,
  onFiltersChange,
  onPageChange,
  className,
}: CustomersTableProps) {
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string>(filters.sortBy || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters.sortOrder || 'desc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('desc');
    }
    onFiltersChange({ sortBy: column, sortOrder: sortColumn === column ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc' });
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.size === customers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(customers.map(c => c.id)));
    }
  };

  const toggleSelectCustomer = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedCustomers.size === 0) return;

    const customerIds = Array.from(selectedCustomers);
    
    try {
      const { endpoints } = await import('@/lib/api/client');
      const response = await endpoints.admin.customers.bulkAction({
        customerIds,
        action: action as 'email' | 'export' | 'tag' | 'segment' | 'delete',
      }) as { data?: { data?: unknown[] }; [key: string]: unknown };

      if (action === 'export') {
        // Download CSV
        const csv = convertToCSV((response?.data?.data || []) as Record<string, unknown>[]);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers-export-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      // Clear selection after action
      setSelectedCustomers(new Set());
    } catch (error) {
      logger.error(`Bulk action ${action} failed:`, error);
    }
  };

  const convertToCSV = (data: Array<Record<string, unknown>>) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    }));
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  };

  if (isLoading) {
    return (
      <Card className={cn('bg-zinc-800 border-zinc-700', className)}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-zinc-700 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-zinc-800 border-zinc-700', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">
            Customers ({pagination.total})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search customers..."
                value={filters.search || ''}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                className="pl-10 bg-zinc-900 border-zinc-700 text-white"
              />
            </div>
          </div>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => onFiltersChange({ status: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-[150px] bg-zinc-900 border-zinc-700 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="churned">Churned</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.plan || 'all'}
            onValueChange={(value) => onFiltersChange({ plan: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-[150px] bg-zinc-900 border-zinc-700 text-white">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="team">Team</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedCustomers.size > 0 && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-zinc-900 rounded-lg">
            <span className="text-sm text-zinc-400">
              {selectedCustomers.size} selected
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('email')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('export')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomers(new Set())}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border border-zinc-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700 hover:bg-zinc-800">
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.size === customers.length && customers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-600 bg-zinc-900"
                  />
                </TableHead>
                <TableHead className="text-zinc-400">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    Customer
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="text-zinc-400">Plan</TableHead>
                <TableHead className="text-zinc-400">
                  <button
                    onClick={() => handleSort('mrr')}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    MRR
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="text-zinc-400">
                  <button
                    onClick={() => handleSort('ltv')}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    LTV
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Risk</TableHead>
                <TableHead className="text-zinc-400 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-zinc-500">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="border-zinc-700 hover:bg-zinc-800/50"
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedCustomers.has(customer.id)}
                        onChange={() => toggleSelectCustomer(customer.id)}
                        className="rounded border-zinc-600 bg-zinc-900"
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="flex items-center gap-3 hover:text-white transition-colors"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={customer.avatar || undefined} />
                          <AvatarFallback className="bg-zinc-700 text-zinc-300">
                            {customer.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-white">{customer.name}</div>
                          <div className="text-sm text-zinc-400">{customer.email}</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {customer.plan ? (
                        <Badge variant="secondary" className="capitalize">
                          {customer.plan}
                        </Badge>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-white">
                      {formatCurrency(customer.planPrice || 0)}
                    </TableCell>
                    <TableCell className="text-white">
                      {formatCurrency(customer.ltv)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', statusColors[customer.status] || statusColors.none)}
                      >
                        {customer.status === 'at-risk' ? 'At Risk' : customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn('text-sm', churnRiskColors[customer.churnRisk])}>
                        {customer.churnRisk.charAt(0).toUpperCase() + customer.churnRisk.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-zinc-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} customers
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-zinc-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
