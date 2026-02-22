'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  PackageCheck,
  Banknote,
} from 'lucide-react';

import {
  useReturns,
  useProcessReturn,
  useMarkReturnReceived,
  useProcessRefund,
} from '@/hooks/usePCE';

interface ReturnItem {
  id: string;
  orderId: string;
  status: string;
  reason: string;
  reasonDetails?: string | null;
  receivedAt?: string | null;
  refundedAt?: string | null;
  createdAt?: string;
}

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Demandé',
  APPROVED: 'Approuvé',
  REJECTED: 'Refusé',
  LABEL_CREATED: 'Étiquette créée',
  IN_TRANSIT: 'En transit',
  RECEIVED: 'Reçu',
  INSPECTED: 'Inspecté',
  REFUND_PENDING: 'Remboursement en attente',
  REFUNDED: 'Remboursé',
  CLOSED: 'Clos',
  CANCELLED: 'Annulé',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  REQUESTED: 'secondary',
  APPROVED: 'default',
  REJECTED: 'destructive',
  LABEL_CREATED: 'default',
  IN_TRANSIT: 'default',
  RECEIVED: 'default',
  INSPECTED: 'default',
  REFUND_PENDING: 'default',
  REFUNDED: 'outline',
  CLOSED: 'outline',
  CANCELLED: 'destructive',
};

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  return STATUS_VARIANT[status] ?? 'secondary';
}

export function ReturnsPanel() {
  const [refundId, setRefundId] = useState<string | null>(null);

  const { data, isLoading } = useReturns({ limit: 50 });
  const processReturn = useProcessReturn();
  const markReceived = useMarkReturnReceived();
  const processRefund = useProcessRefund();

  const response = data as { items?: ReturnItem[]; total?: number } | undefined;
  const items: ReturnItem[] =
    response?.items ?? Array.isArray(data) ? (data as ReturnItem[]) : [];

  const canApproveReject = (s: string) => s === 'REQUESTED';
  const canMarkReceived = (s: string) =>
    ['APPROVED', 'LABEL_CREATED', 'IN_TRANSIT'].includes(s);
  const canRefund = (s: string) =>
    ['RECEIVED', 'INSPECTED', 'REFUND_PENDING'].includes(s);

  const handleProcess = (id: string, action: string) => {
    processReturn.mutate({ id, action });
  };

  const handleMarkReceived = (id: string) => {
    markReceived.mutate(id);
  };

  const handleRefund = (id: string) => {
    processRefund.mutate({ id });
    setRefundId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Retours</CardTitle>
          <CardDescription>Demandes de retour et remboursements</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-8 text-center">
            Aucune demande de retour
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Retours</CardTitle>
          <CardDescription>Demandes de retour et remboursements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Reçu le</TableHead>
                  <TableHead>Créé</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.orderId}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {row.reason}
                      {row.reasonDetails ? ` — ${row.reasonDetails}` : ''}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(row.status)}>
                        {STATUS_LABELS[row.status] ?? row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.receivedAt
                        ? formatDistanceToNow(new Date(row.receivedAt), {
                            addSuffix: true,
                            locale: fr,
                          })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.createdAt
                        ? formatDistanceToNow(new Date(row.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canApproveReject(row.status) && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleProcess(row.id, 'APPROVED')}
                                disabled={processReturn.isPending}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approuver
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleProcess(row.id, 'REJECTED')}
                                disabled={processReturn.isPending}
                                className="text-destructive focus:text-destructive"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Refuser
                              </DropdownMenuItem>
                            </>
                          )}
                          {canMarkReceived(row.status) && (
                            <DropdownMenuItem
                              onClick={() => handleMarkReceived(row.id)}
                              disabled={markReceived.isPending}
                            >
                              <PackageCheck className="mr-2 h-4 w-4" />
                              Marquer reçu
                            </DropdownMenuItem>
                          )}
                          {canRefund(row.status) && (
                            <DropdownMenuItem
                              onClick={() => setRefundId(row.id)}
                              disabled={processRefund.isPending}
                            >
                              <Banknote className="mr-2 h-4 w-4" />
                              Rembourser
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!refundId} onOpenChange={(open) => !open && setRefundId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Traiter le remboursement</AlertDialogTitle>
            <AlertDialogDescription>
              Le remboursement sera enregistré pour ce retour. Confirmer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => refundId && handleRefund(refundId)}>
              Confirmer le remboursement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
