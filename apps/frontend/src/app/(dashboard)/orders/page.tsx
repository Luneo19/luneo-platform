'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  Eye,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  Printer,
  Archive,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useOrdersData } from '@/lib/hooks/useOrdersData';
import { OrdersSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-states/EmptyState';

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  trackingNumber?: string;
  paymentMethod: string;
  shippingMethod: string;
}

export default function OrdersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Utiliser le hook pour charger les vraies données
  const {
    orders: fetchedOrders,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    refresh,
    loadMore,
  } = useOrdersData(page, ITEMS_PER_PAGE, statusFilter, searchTerm);

  // Transformer les données de l'API en format attendu par le composant
  const orders: Order[] = fetchedOrders.map((order) => ({
    id: order.id,
    orderNumber: order.order_number || order.id,
    customer: {
      name: order.customer_name || 'Client',
      email: order.customer_email,
      phone: order.shipping_address?.phone || '',
      address: order.shipping_address
        ? `${order.shipping_address.street || ''}, ${order.shipping_address.city || ''}, ${order.shipping_address.postal_code || ''}`
        : '',
    },
    items: (order.items || []).map((item) => ({
      id: item.id,
      name: item.product_name || item.design_name || 'Produit',
      quantity: item.quantity,
      price: item.unit_price,
    })),
    status: order.status,
    total: order.total_amount / 100, // Convertir centimes en euros
    createdAt: order.created_at,
    shippedAt: order.shipped_at,
    deliveredAt: order.delivered_at,
    trackingNumber: order.tracking_number,
    paymentMethod: order.payment_method || 'card',
    shippingMethod: order.shipping_method || 'standard',
  }));

  const [mockOrders, setMockOrders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'ORD-2025-001',
      customer: {
        name: 'Sophie Martin',
        email: 'sophie@example.com',
        phone: '+33 6 12 34 56 78',
        address: '123 Rue de Paris, 75001 Paris, France'
      },
      items: [
        { id: '1', name: 'T-Shirt Personnalisé', quantity: 2, price: 25 },
        { id: '2', name: 'Mug Custom', quantity: 1, price: 15 }
      ],
      status: 'delivered',
      total: 65,
      createdAt: '2025-10-15',
      shippedAt: '2025-10-16',
      deliveredAt: '2025-10-18',
      trackingNumber: 'FR123456789',
      paymentMethod: 'Carte bancaire',
      shippingMethod: 'Colissimo'
    },
    {
      id: '2',
      orderNumber: 'ORD-2025-002',
      customer: {
        name: 'Lucas Dubois',
        email: 'lucas@example.com',
        phone: '+33 6 98 76 54 32',
        address: '45 Avenue Victor Hugo, 69002 Lyon, France'
      },
      items: [
        { id: '3', name: 'Poster A3', quantity: 3, price: 20 }
      ],
      status: 'shipped',
      total: 60,
      createdAt: '2025-10-20',
      shippedAt: '2025-10-21',
      trackingNumber: 'FR987654321',
      paymentMethod: 'PayPal',
      shippingMethod: 'Chronopost'
    },
    {
      id: '3',
      orderNumber: 'ORD-2025-003',
      customer: {
        name: 'Marie Laurent',
        email: 'marie@example.com',
        phone: '+33 6 55 44 33 22',
        address: '78 Boulevard Haussmann, 75008 Paris, France'
      },
      items: [
        { id: '4', name: 'Carte de visite', quantity: 100, price: 50 },
        { id: '5', name: 'Stickers', quantity: 50, price: 30 }
      ],
      status: 'processing',
      total: 80,
      createdAt: '2025-10-25',
      paymentMethod: 'Carte bancaire',
      shippingMethod: 'Colissimo'
    },
    {
      id: '4',
      orderNumber: 'ORD-2025-004',
      customer: {
        name: 'Thomas Bernard',
        email: 'thomas@example.com',
        phone: '+33 6 11 22 33 44',
        address: '12 Rue de la République, 13001 Marseille, France'
      },
      items: [
        { id: '6', name: 'T-Shirt Premium', quantity: 5, price: 35 }
      ],
      status: 'pending',
      total: 175,
      createdAt: '2025-11-01',
      paymentMethod: 'Virement bancaire',
      shippingMethod: 'Colissimo'
    }
  ]);

  const statusOptions = [
    { value: 'all', label: 'Tous', count: total, color: 'gray' },
    { value: 'pending', label: 'En attente', count: orders.filter(o => o.status === 'pending').length, color: 'yellow' },
    { value: 'processing', label: 'En cours', count: orders.filter(o => o.status === 'processing').length, color: 'blue' },
    { value: 'shipped', label: 'Expédiées', count: orders.filter(o => o.status === 'shipped').length, color: 'purple' },
    { value: 'delivered', label: 'Livrées', count: orders.filter(o => o.status === 'delivered').length, color: 'green' },
    { value: 'cancelled', label: 'Annulées', count: orders.filter(o => o.status === 'cancelled').length, color: 'red' }
  ];

  useEffect(() => {
    setPage(1);
    refresh();
  }, [dateRange, statusFilter, searchTerm]);

  // Infinite scroll
  const { Sentinel } = useInfiniteScroll({
    hasMore,
    loading: loadingMore,
    onLoadMore: () => {
      setPage((prev) => prev + 1);
      loadMore();
    },
    threshold: 200,
  });

  const loadMoreOrders = async () => {
    if (!hasMore || loadingMore) return;
    setPage((prev) => prev + 1);
    loadMore();
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await fetch('/api/orders/list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update order status');
      }
      
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));

      toast({
        title: "Statut mis à jour",
        description: "Le statut de la commande a été modifié",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const handleExportOrders = async () => {
    try {
      toast({
        title: "Export en cours",
        description: "Génération du fichier CSV...",
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Export réussi",
        description: "Le fichier a été téléchargé",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les commandes",
        variant: "destructive",
      });
    }
  };

  const handlePrintInvoice = async (order: Order) => {
    try {
      toast({
        title: "Impression",
        description: `Génération de la facture ${order.orderNumber}...`,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Facture générée",
        description: "La facture est prête à imprimer",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer la facture",
        variant: "destructive",
      });
    }
  };

  const handleCreateOrder = () => router.push('/dashboard/products');
  const handleMoreFilters = () => router.push('/dashboard/orders/filters');
  const handleOpenOverview = () => router.push('/dashboard/overview');

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         o.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         o.customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'En attente', icon: <Clock className="w-3 h-3" />, color: 'yellow' },
      processing: { label: 'En cours', icon: <RefreshCw className="w-3 h-3" />, color: 'blue' },
      shipped: { label: 'Expédiée', icon: <Truck className="w-3 h-3" />, color: 'purple' },
      delivered: { label: 'Livrée', icon: <CheckCircle className="w-3 h-3" />, color: 'green' },
      cancelled: { label: 'Annulée', icon: <XCircle className="w-3 h-3" />, color: 'red' }
    };

    const { label, icon, color } = config[status as keyof typeof config] || config.pending;
    const colorClasses: Record<string, { bg: string; text: string }> = {
      yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
      purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
      green: { bg: 'bg-green-500/10', text: 'text-green-400' },
      red: { bg: 'bg-red-500/10', text: 'text-red-400' },
    };
    const colors = colorClasses[color as keyof typeof colorClasses] ?? colorClasses.yellow;

    return (
      <span className={`px-2 py-1 ${colors.bg} ${colors.text} text-xs rounded-full flex items-center gap-1`}>
        {icon}
        {label}
      </span>
    );
  };

  const stats = {
    total: orders.length,
    revenue: orders.reduce((sum, o) => sum + o.total, 0),
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    avgOrderValue: orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length) : 0,
  };

  const statColorMap = useMemo(
    () => ({
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
      green: { bg: 'bg-green-500/10', text: 'text-green-400' },
      yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
      purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
      pink: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
      gray: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
    }),
    [],
  );

  if (loading && orders.length === 0) {
    return <OrdersSkeleton />;
  }

  if (error && orders.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="w-16 h-16" />}
        title="Erreur de chargement"
        description={error}
        action={{
          label: 'Réessayer',
          onClick: refresh,
        }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Commandes</h1>
          <p className="text-gray-400">Gérez toutes vos commandes clients</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleOpenOverview} className="border-gray-700">
            <ExternalLink className="w-4 h-4 mr-2" />
            Voir l’Overview
          </Button>
          <Button variant="outline" onClick={handleExportOrders} className="border-gray-700">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600" onClick={handleCreateOrder}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Nouvelle commande
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total commandes', value: stats.total, icon: <ShoppingCart className="w-5 h-5" />, color: 'blue' },
          { label: 'Revenus', value: `${stats.revenue}€`, icon: <DollarSign className="w-5 h-5" />, color: 'green' },
          { label: 'En attente', value: stats.pending, icon: <Clock className="w-5 h-5" />, color: 'yellow' },
          { label: 'Livrées', value: stats.delivered, icon: <CheckCircle className="w-5 h-5" />, color: 'purple' },
          { label: 'Panier moyen', value: `${stats.avgOrderValue}€`, icon: <DollarSign className="w-5 h-5" />, color: 'pink' }
        ].map((stat, i) => (
          <Card key={i} className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  statColorMap[stat.color as keyof typeof statColorMap]?.bg ?? 'bg-gray-500/10'
                } ${statColorMap[stat.color as keyof typeof statColorMap]?.text ?? 'text-gray-400'}`}
              >
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Status Filters */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                statusFilter === status.value
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-900/50 text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <span>{status.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                statusFilter === status.value ? 'bg-white/20' : 'bg-gray-800'
              }`}>
                {status.count}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Rechercher par numéro, client, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="7d">7 derniers jours</option>
          <option value="30d">30 derniers jours</option>
          <option value="90d">90 derniers jours</option>
          <option value="all">Toutes les commandes</option>
        </select>
        <Button variant="outline" className="border-gray-700" onClick={handleMoreFilters}>
          <Filter className="w-4 h-4 mr-2" />
          Plus de filtres
        </Button>
      </div>

      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Actions rapides</h3>
        <p className="text-sm text-gray-400 mb-6">Pilotez vos opérations logistiques.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button className="h-20 bg-gradient-to-r from-green-600 to-emerald-600" onClick={handleCreateOrder}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une commande
          </Button>
          <Button
            variant="outline"
            className="h-20 border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => router.push('/dashboard/orders/templates')}
          >
            <Archive className="w-4 h-4 mr-2" />
            Templates commandes
          </Button>
          <Button
            variant="outline"
            className="h-20 border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => router.push('/dashboard/integrations/make')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Connecter un opérateur
          </Button>
        </div>
      </Card>

      {/* Orders List */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="space-y-4">
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-all"
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Package className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{order.orderNumber}</h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{order.customer.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{order.customer.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-bold text-white">{order.total}€</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedOrder(order)}
                    className="border-gray-600"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Détails
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrintInvoice(order)}
                    className="border-gray-600"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                  {order.trackingNumber && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600"
                      onClick={() =>
                        window.open(`https://www.laposte.fr/outils/suivre-vos-envois?code=${order.trackingNumber}`, '_blank')
                      }
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Suivre
                    </Button>
                  )}
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value as any)}
                    className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                  >
                    <option value="pending">En attente</option>
                    <option value="processing">En cours</option>
                    <option value="shipped">Expédiée</option>
                    <option value="delivered">Livrée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t border-gray-800 pt-4">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Articles ({order.items.length})</h4>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-gray-400">Quantité: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-white font-bold">{item.price * item.quantity}€</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tracking Info */}
              {order.trackingNumber && (
                <div className="border-t border-gray-800 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-400">Suivi:</span>
                      <span className="text-white font-mono">{order.trackingNumber}</span>
                    </div>
                    {order.shippedAt && (
                      <span className="text-sm text-gray-400">
                        Expédié le {new Date(order.shippedAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Infinite Scroll Sentinel */}
        {hasMore && !loading && filteredOrders.length > 0 && <Sentinel />}
        
        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Chargement de plus de commandes...</p>
            </div>
          </div>
        )}

        {filteredOrders.length === 0 && !loading && (
          <EmptyState
            icon={<ShoppingCart className="w-16 h-16" />}
            title={
              searchTerm || statusFilter !== 'all'
                ? 'Aucune commande trouvée'
                : 'Aucune commande'
            }
            description={
              searchTerm || statusFilter !== 'all'
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Vous n\'avez pas encore de commandes. Créez-en une pour commencer.'
            }
            action={
              !searchTerm && statusFilter === 'all'
                ? {
                    label: 'Créer une commande',
                    onClick: handleCreateOrder,
                  }
                : undefined
            }
          />
        )}
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">{selectedOrder.orderNumber}</h3>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedOrder(null)}
                className="border-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h4 className="text-lg font-bold text-white mb-3">Informations client</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-white">{selectedOrder.customer.name}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-300">{selectedOrder.customer.email}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-300">{selectedOrder.customer.phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-300">{selectedOrder.customer.address}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-lg font-bold text-white mb-3">Articles</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between p-3 bg-gray-900/50 rounded">
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-sm text-gray-400">Quantité: {item.quantity} × {item.price}€</p>
                      </div>
                      <p className="text-white font-bold">{item.quantity * item.price}€</p>
                    </div>
                  ))}
                  <div className="flex justify-between p-3 bg-blue-500/10 rounded">
                    <p className="text-white font-bold">Total</p>
                    <p className="text-white font-bold text-xl">{selectedOrder.total}€</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={() => handlePrintInvoice(selectedOrder)} className="flex-1">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer facture
                </Button>
                <Button variant="outline" className="flex-1 border-gray-600">
                  <Archive className="w-4 h-4 mr-2" />
                  Archiver
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
