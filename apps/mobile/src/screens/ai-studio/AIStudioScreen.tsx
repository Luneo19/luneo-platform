import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { useDesignsStore } from '@/store/designs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const AIStudioScreen: React.FC = () => {
  const { designs, isLoading, isGenerating, loadDesigns, generateDesign, clearError, error } = useDesignsStore();

  useEffect(() => {
    loadDesigns(1, true).catch(() => undefined);
    return () => clearError();
  }, [clearError, loadDesigns]);

  const handleRefresh = useCallback(() => {
    loadDesigns(1, true).catch(() => undefined);
  }, [loadDesigns]);

  const handleGenerateSample = useCallback(() => {
    generateDesign('Concept de mobilier premium pour showroom', {
      style: 'moderne',
      dimensions: '1024x1024',
    }).catch(() => undefined);
  }, [generateDesign]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Studio IA</Text>
          <Text style={styles.subtitle}>Vos créations générées par l'intelligence artificielle</Text>
        </View>
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerateSample} disabled={isGenerating}>
          <Text style={styles.generateButtonText}>{isGenerating ? 'Génération…' : '+ Nouveau design'}</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={designs}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#2563eb" />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.previewUrl || item.imageUrl ? (
              <Image source={{ uri: item.previewUrl ?? item.imageUrl ?? '' }} style={styles.thumbnail} />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                <Text style={styles.thumbnailText}>{item.name?.slice(0, 2).toUpperCase() ?? 'AI'}</Text>
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name ?? 'Design sans titre'}</Text>
              <Text style={styles.cardSubtitle}>{item.status}</Text>
              <Text style={styles.cardDate}>
                Généré le {format(new Date(item.createdAt), 'dd MMM HH:mm', { locale: fr })}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aucun design généré</Text>
              <Text style={styles.emptySubtitle}>Lancez une génération pour remplir votre studio IA.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={designs.length === 0 ? styles.listEmptyContainer : undefined}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    maxWidth: 240,
  },
  generateButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  generateButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  thumbnailPlaceholder: {
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailText: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 18,
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
  cardDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 12,
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
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  listEmptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

export default AIStudioScreen;
