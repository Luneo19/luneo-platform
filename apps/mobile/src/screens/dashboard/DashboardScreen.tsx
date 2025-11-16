import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Dimensions, Image, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LineChart } from 'react-native-chart-kit';
import { dashboardApi } from '@/services/dashboard';
import type { DashboardOverview } from '@/services/dashboard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const chartWidth = Dimensions.get('window').width - 48;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

const MetricCard: React.FC<{ label: string; value: string; subLabel?: string; accent: string }> = ({
  label,
  value,
  subLabel,
  accent,
}) => (
  <View style={[styles.metricCard, { borderLeftColor: accent }]}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    {subLabel ? <Text style={styles.metricSubLabel}>{subLabel}</Text> : null}
  </View>
);

export const DashboardScreen: React.FC = () => {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery<DashboardOverview>({
    queryKey: ['dashboard', 'overview'],
    queryFn: dashboardApi.getOverview,
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Chargement du tableau de bord…</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Impossible de charger les statistiques</Text>
        <Text style={styles.errorSubtitle}>Vérifiez votre connexion puis réessayez.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563eb" />}
    >
      <Text style={styles.header}>Bonjour 👋</Text>
      <Text style={styles.subHeader}>Voici les performances récentes de votre activité</Text>

      <View style={styles.metricsGrid}>
        <MetricCard
          label="Designs générés"
          value={data.metrics.designsGenerated.toString()}
          subLabel="+18% vs semaine dernière"
          accent="#2563eb"
        />
        <MetricCard
          label="Commandes actives"
          value={data.metrics.activeOrders.toString()}
          subLabel="En cours de production"
          accent="#7c3aed"
        />
        <MetricCard
          label="Revenu 7 derniers jours"
          value={formatCurrency(data.metrics.revenue)}
          accent="#16a34a"
        />
        <MetricCard
          label="Taux de conversion"
          value={`${data.metrics.conversionRate.toFixed(1)}%`}
          accent="#f97316"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Revenus hebdomadaires</Text>
        <LineChart
          data={{
            labels: data.revenueTrend.labels,
            datasets: [
              {
                data: data.revenueTrend.values,
              },
            ],
          }}
          width={chartWidth}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#1d4ed8',
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Designs populaires</Text>
        {data.topDesigns.map((design) => (
          <View key={design.id} style={styles.listItem}>
            {design.thumbnailUrl ? (
              <Image source={{ uri: design.thumbnailUrl }} style={styles.thumbnail} />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}> 
                <Text style={styles.thumbnailText}>{design.name.slice(0, 2).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{design.name}</Text>
              <Text style={styles.listItemSubtitle}>
                {design.status} · {format(new Date(design.createdAt), 'dd MMM HH:mm', { locale: fr })}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Commandes récentes</Text>
        {data.recentOrders.map((order) => (
          <View key={order.id} style={styles.listItem}>
            <View style={[styles.thumbnail, styles.orderBadge]}> 
              <Text style={styles.thumbnailText}>{order.customer.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{order.customer}</Text>
              <Text style={styles.listItemSubtitle}>
                {formatCurrency(order.total)} · {order.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.listItemDate}>
              {format(new Date(order.createdAt), 'dd MMM', { locale: fr })}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subHeader: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  metricSubLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  listItemSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  listItemDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholder: {
    backgroundColor: '#cbd5f5',
  },
  thumbnailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#312e81',
  },
  orderBadge: {
    backgroundColor: '#dbeafe',
  },
  centered: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    color: '#475569',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#b91c1c',
    marginBottom: 8,
  },
  errorSubtitle: {
    color: '#7f1d1d',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default DashboardScreen;
