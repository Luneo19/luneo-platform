'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
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
import { MoreHorizontal, Truck, CheckCircle, XCircle } from 'lucide-react';

import {
  useFulfillments,
  useShipFulfillment,
  useDeliverFulfillment,
  useCancelFulfillment,
} from '@/hooks/usePCE';

interface FulfillmentItem {
  id: string;
  orderId: string;
  status: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  pipeline?: { orderId?: string };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  PICKING: 'Préparation',
  PACKING: 'Emballage',
  READY_TO_SHIP: 'Prêt à expédier',
  SHIPPED: 'Expédié',
  IN_TRANSIT: 'En transit',
  OUT_FOR_DELIVERY: 'En livraison',
  DELIVERED: 'Livré',
  CANCELLED: 'Annulé',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  PICKING: 'default',
  PACKING: 'default',
  READY_TO_SHIP: 'default',
  SHIPPED: 'default',
  IN_TRANSIT: 'default',
  OUT_FOR_DELIVERY: 'default',
  DELIVERED: 'outline',
  CANCELLED: 'destructive',
};

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  return STATUS_VARIANT[status] ?? 'secondary';
}

export function FulfillmentList() {
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data, isLoading } = useFulfillments({ limit: 50 });
  const shipFulfillment = useShipFulfillment();
  const deliverFulfillment = useDeliverFulfillment();
  const cancelFulfillment = useCancelFulfillment();

  const response = data as { items?: FulfillmentItem[]; total?: number } | undefined;
  const items: FulfillmentItem[] = response?.items ?? Array.isArray(data) ? (data as FulfillmentItem[]) : [];

  const canShip = (s: string) =>
    ['READY_TO_SHIP', 'PENDING', 'PICKING', 'PACKING'].includes(s);
  const canDeliver = (s: string) =>
    ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s);
  const canCancel = (s: string) =>
    ['PENDING', 'PICKING', 'PACKING', 'READY_TO_SHIP'].includes(s);

  const handleShip = (id: string) => {
    shipFulfillment.mutate({ id });
  };

  const handleDeliver = (id: string) => {
    deliverFulfillment.mutate(id);
  };

  const handleCancel = (id: string) => {
    cancelFulfillment.mutate(id);
    setCancelId(null);
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
      <p className="text-muted-foreground py-8 text-center">
        Aucune expédition pour le moment
      </p>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Commande</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Transporteur</TableHead>
              <TableHead>N° de suivi</TableHead>
              <TableHead>Expédié le</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {row.pipeline?.orderId ?? row.orderId}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(row.status)}>
                    {STATUS_LABELS[row.status] ?? row.status}
                  </Badge>
                </TableCell>
                <TableCell>{row.carrier ?? '—'}</TableCell>
                <TableCell>{row.trackingNumber ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.shippedAt
                    ? formatDistanceToNow(new Date(row.shippedAt), {
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
                      {canShip(row.status) && (
                        <DropdownMenuItem
                          onClick={() => handleShip(row.id)}
                          disabled={shipFulfillment.isPending}
                        >
                          <Truck className="mr-2 h-4 w-4" />
                          Marquer expédié
                        </DropdownMenuItem>
                      )}
                      {canDeliver(row.status) && (
                        <DropdownMenuItem
                          onClick={() => handleDeliver(row.id)}
                          disabled={deliverFulfillment.isPending}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marquer livré
                        </DropdownMenuItem>
                      )}
                      {canCancel(row.status) && (
                        <DropdownMenuItem
                          onClick={() => setCancelId(row.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Annuler
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

      <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler l&apos;expédition</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;expédition sera marquée comme annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelId && handleCancel(cancelId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Annuler l&apos;expédition
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
