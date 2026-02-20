'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';
import { ModerationReview } from './ModerationReview';
import Image from 'next/image';

interface ModerationItem {
  id: string;
  designId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  previewUrl: string;
  reason: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  flaggedAt: string;
  flaggedBy?: 'auto' | 'user';
  detectionMethod: string;
}

interface ModerationQueueProps {
  customizerId: string;
}

export function ModerationQueue({ customizerId }: ModerationQueueProps) {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadItems = async () => {
    try {
      const result = await api.get<ModerationItem[]>(
        `/api/v1/visual-customizer/customizers/${customizerId}/moderation`,
        {
          params: { status: statusFilter },
        }
      );
      setItems(result);
    } catch (err) {
      logger.error('Failed to load moderation queue', { error: err });
    }
  };

  const handleBatchAction = async (action: 'approve' | 'reject') => {
    if (selectedIds.size === 0) return;

    try {
      await api.post(`/api/v1/visual-customizer/customizers/${customizerId}/moderation/batch`, {
        ids: Array.from(selectedIds),
        action,
      });
      setSelectedIds(new Set());
      loadItems();
    } catch (err) {
      logger.error('Failed to perform batch action', { error: err });
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: ModerationItem['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: AlertTriangle },
      approved: { variant: 'default' as const, icon: CheckCircle2 },
      rejected: { variant: 'destructive' as const, icon: XCircle },
      escalated: { variant: 'outline' as const, icon: AlertTriangle },
    };
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Moderation Queue</h2>
          <p className="text-muted-foreground">Review and moderate flagged designs</p>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => handleBatchAction('approve')}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve ({selectedIds.size})
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBatchAction('reject')}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by user, email, or reason..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Preview</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => handleToggleSelect(item.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell>
                  <div className="w-16 h-16 bg-muted rounded overflow-hidden">
                    <Image width={200} height={200}
                      src={item.previewUrl}
                      alt="Design preview"
                      className="w-full h-full object-cover"
                    unoptimized />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {item.userAvatar && <Image src={item.userAvatar} alt={item.userName} width={200} height={200} unoptimized />}
                      <AvatarFallback>
                        {item.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{item.userName}</div>
                      <div className="text-xs text-muted-foreground">{item.userEmail}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <div className="text-sm">{item.reason}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.detectionMethod} • {item.flaggedBy || 'auto'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">
                    {(item.confidence * 100).toFixed(0)}%
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {new Date(item.flaggedAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(item.flaggedAt).toLocaleTimeString()}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(item);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No items found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Review Dialog */}
      {selectedItem && (
        <ModerationReview
          item={selectedItem}
          customizerId={customizerId}
          onClose={() => {
            setSelectedItem(null);
            loadItems();
          }}
        />
      )}
    </div>
  );
}
