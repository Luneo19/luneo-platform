import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { productsApi } from '@/services/api';
import type { Product } from '@luneo/types';
import { formatCurrency } from '@/utils/format';

export const ProductsScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(
    async (query?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await productsApi.list({ page: 1, limit: 20, search: query });
        setProducts(response.data ?? []);
      } catch (err) {
        setError('Impossible de charger les produits.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchProducts().catch(() => undefined);
  }, [fetchProducts]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchProducts(search)
      .catch(() => undefined)
      .finally(() => setIsRefreshing(false));
  }, [fetchProducts, search]);

  const onSubmitSearch = useCallback(() => {
    fetchProducts(search).catch(() => undefined);
  }, [fetchProducts, search]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catalogue produits</Text>
      <Text style={styles.subtitle}>Consultez vos fiches produit synchronisées</Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={onSubmitSearch}
        placeholder="Rechercher un produit, une référence…"
        style={styles.searchInput}
        returnKeyType="search"
      />

      {error ? (
        <TouchableOpacity onPress={() => fetchProducts(search)} style={styles.errorBanner}>
          <Text style={styles.errorText}>{error} · Appuyez pour réessayer</Text>
        </TouchableOpacity>
      ) : null}

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.description ?? 'Aucune description'}</Text>
                <Text style={styles.cardMeta}>
                  {formatCurrency(item.price)} · {item.currency}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aucun produit disponible</Text>
              <Text style={styles.emptySubtitle}>Synchronisez vos canaux e-commerce pour alimenter ce flux.</Text>
            </View>
          }
          contentContainerStyle={products.length === 0 ? styles.listEmptyContainer : undefined}
        />
      )}
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
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
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
  cardMeta: {
    marginTop: 12,
    fontSize: 12,
    color: '#94a3b8',
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

export default ProductsScreen;
