import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { ordersApi } from '@/services/api';
import type { Order } from '@luneo/types';
import { formatCurrency, formatDate } from '@/utils/format';

const STATUS_COLORS: Record<string, string> = {
  processing: '#2563eb',
  shipped: '#16a34a',
  delivered: '#4f46e5',
  cancelled: '#dc2626',
  refunded: '#d97706',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const color = STATUS_COLORS[status.toLowerCase()] ?? '#334155';
  return (
    <View style={[styles.badge, { backgroundColor: `${color}15`, borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{status.toUpperCase()}</Text>
    </View>
  );
};

export const OrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ordersApi.list({ page: 1, limit: 20 });
      setOrders(response.data ?? []);
    } catch (err) {
      setError('Impossible de récupérer les commandes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders().catch(() => undefined);
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchOrders()
      .catch(() => undefined)
      .finally(() => setIsRefreshing(false));
  }, [fetchOrders]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Commandes</Text>
      <Text style={styles.subtitle}>Suivez l'état de vos commandes clients</Text>

      {error ? (
        <TouchableOpacity onPress={() => fetchOrders()} style={styles.errorBanner}>
          <Text style={styles.errorText}>{error} · Appuyez pour réessayer</Text>
        </TouchableOpacity>
      ) : null}

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing || isLoading} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.orderNumber ?? item.id}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.cardSubtitle}>{item.customerEmail ?? 'Client inconnu'}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardMeta}>
                {formatCurrency((item.totalCents ?? 0) / 100, item.currency)}
              </Text>
              <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aucune commande</Text>
              <Text style={styles.emptySubtitle}>Les commandes récentes apparaîtront ici automatiquement.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={orders.length === 0 ? styles.listEmptyContainer : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 8,
  },
  errorBanner: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  cardMeta: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  cardDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
  },
  listEmptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

export default OrdersScreen;
