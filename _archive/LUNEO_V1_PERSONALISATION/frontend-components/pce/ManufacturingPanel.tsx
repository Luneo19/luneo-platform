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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Factory, Package, MoreHorizontal, XCircle } from 'lucide-react';

import {
  useProductionOrders,
  usePODProviders,
  useCancelProductionOrder,
} from '@/hooks/usePCE';

interface ProductionOrderItem {
  id: string;
  orderId?: string;
  status: string;
  providerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PODProviderItem {
  id: string;
  name?: string;
  slug?: string;
  providerType?: string;
  status?: string;
  priority?: number;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  SUBMITTED: 'Envoyé',
  IN_PRODUCTION: 'En production',
  QUALITY_CHECK: 'Contrôle qualité',
  COMPLETED: 'Terminé',
  FAILED: 'Échoué',
  CANCELLED: 'Annulé',
};

const ORDER_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  SUBMITTED: 'default',
  IN_PRODUCTION: 'default',
  QUALITY_CHECK: 'default',
  COMPLETED: 'outline',
  FAILED: 'destructive',
  CANCELLED: 'destructive',
};

function getOrderStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  return ORDER_STATUS_VARIANT[status] ?? 'secondary';
}

export function ManufacturingPanel() {
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);

  const { data: ordersData, isLoading: ordersLoading } = useProductionOrders({
    limit: 50,
  });
  const { data: providersData, isLoading: providersLoading } = usePODProviders();
  const cancelOrder = useCancelProductionOrder();

  const ordersResponse = ordersData as { items?: ProductionOrderItem[]; total?: number } | undefined;
  const orders: ProductionOrderItem[] =
    ordersResponse?.items ?? Array.isArray(ordersData) ? (ordersData as ProductionOrderItem[]) : [];

  const providers: PODProviderItem[] = Array.isArray(providersData)
    ? (providersData as PODProviderItem[])
    : (providersData as { items?: PODProviderItem[] })?.items ?? [];

  const cancellableStatuses = ['PENDING', 'SUBMITTED'];
  const canCancelOrder = (status: string) => cancellableStatuses.includes(status);

  const handleCancelOrder = (id: string) => {
    cancelOrder.mutate(id);
    setCancelOrderId(null);
  };

  return (
    <Tabs defaultValue="orders" className="space-y-4">
      <TabsList>
        <TabsTrigger value="orders">
          <Package className="mr-2 h-4 w-4" />
          Commandes de production
        </TabsTrigger>
        <TabsTrigger value="providers">
          <Factory className="mr-2 h-4 w-4" />
          Fournisseurs POD
        </TabsTrigger>
      </TabsList>

      <TabsContent value="orders" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Commandes de production</CardTitle>
            <CardDescription>
              Suivi des commandes envoyées aux fournisseurs d&apos;impression à la demande
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                Aucune commande de production
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Commande</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Créée</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {row.orderId ?? row.id}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getOrderStatusVariant(row.status)}>
                            {ORDER_STATUS_LABELS[row.status] ?? row.status}
                          </Badge>
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
                          {canCancelOrder(row.status) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setCancelOrderId(row.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Annuler la commande
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="providers" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Fournisseurs POD</CardTitle>
            <CardDescription>
              Fournisseurs d&apos;impression à la demande connectés à votre marque
            </CardDescription>
          </CardHeader>
          <CardContent>
            {providersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : providers.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                Aucun fournisseur POD configuré
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Priorité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.name ?? p.slug ?? p.id}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.providerType ?? '—'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex h-2 w-2 rounded-full ${
                              p.status === 'ACTIVE' ? 'bg-green-500' : 'bg-muted-foreground'
                            }`}
                          />
                          <span className="ml-2">
                            {p.status === 'ACTIVE' ? 'Actif' : p.status ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell>{p.priority ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <AlertDialog
        open={!!cancelOrderId}
        onOpenChange={(open) => !open && setCancelOrderId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la commande de production</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La commande sera annulée côté fournisseur si
              possible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelOrderId && handleCancelOrder(cancelOrderId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Annuler la commande
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}
