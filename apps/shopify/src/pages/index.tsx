import React, { useCallback, useEffect, useState } from 'react';
import { useAppBridge, AppBridgeProvider } from '../frontend/app-bridge';
import { 
  AppProvider,
  Card, 
  Button, 
  Badge, 
  Spinner,
  Text,
  Layout,
  Page,
  ResourceList,
  ResourceItem,
  Modal,
  Form,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Icon as PolarisIcon,
  Frame,
  Toast,
} from '@shopify/polaris';
import frTranslations from '@shopify/polaris/locales/fr.json';
import {
  SettingsMajor,
  AnalyticsMajor,
  ProductsMajor,
  OrdersMajor,
  BillingStatementDollarMajor,
  QuestionMarkMajor,
  AddMajor,
  ViewMajor,
  StarFilledMinor,
  CircleTickMajor,
  CircleAlertMajor,
  CircleInformationMajor,
  CircleDisabledMajor,
} from '@shopify/polaris-icons';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  aiGenerations: number;
  arViews: number;
  widgetEmbeds: number;
}

interface RecentActivity {
  id: string;
  type: 'ai_generation' | 'ar_view' | 'widget_embed' | 'order' | 'product';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'pending' | 'error';
}

const DashboardPage: React.FC = () => {
  const { actions, context } = useAppBridge();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [toast, setToast] = useState<{ content: string; isError?: boolean } | null>(null);

  const initializeApp = useCallback(async () => {
    try {
      actions.showLoading();
      
      // Charger les données du tableau de bord
      await loadDashboardData();
      
      // Configurer le titre de la page
      actions.setTitle('Luneo - Tableau de bord');
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      setToast({ content: 'Erreur lors du chargement des données', isError: true });
    } finally {
      actions.hideLoading();
    }
  }, [actions]);

  useEffect(() => {
    void initializeApp();
  }, [initializeApp]);

  const loadDashboardData = async () => {
    try {
      // Simuler le chargement des données
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalProducts: 156,
        totalOrders: 89,
        totalCustomers: 234,
        totalRevenue: 12450.50,
        aiGenerations: 1250,
        arViews: 5670,
        widgetEmbeds: 45,
      });

      setRecentActivity([
        {
          id: '1',
          type: 'ai_generation',
          title: 'Génération IA réussie',
          description: 'Produit "T-shirt personnalisé" généré avec succès',
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          status: 'success',
        },
        {
          id: '2',
          type: 'ar_view',
          title: 'Visualisation AR',
          description: 'Client a visualisé le produit en AR',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          status: 'success',
        },
        {
          id: '3',
          type: 'order',
          title: 'Nouvelle commande',
          description: 'Commande #1001 pour 89.99€',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          status: 'success',
        },
        {
          id: '4',
          type: 'widget_embed',
          title: 'Widget intégré',
          description: 'Widget Luneo ajouté à la page produit',
          timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
          status: 'success',
        },
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      throw error;
    }
  };

  const handleSettingsClick = () => {
    setShowSettingsModal(true);
  };

  const handleBillingClick = () => {
    setShowBillingModal(true);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'ai_studio':
        actions.navigate('/ai-studio');
        break;
      case 'ar_viewer':
        actions.navigate('/ar-viewer');
        break;
      case 'widget_config':
        actions.navigate('/widget-config');
        break;
      case 'analytics':
        actions.navigate('/analytics');
        break;
      default:
        actions.showToast('Action non implémentée', 'info');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ai_generation':
        return StarFilledMinor;
      case 'ar_view':
        return ViewMajor;
      case 'widget_embed':
        return AddMajor;
      case 'order':
        return OrdersMajor;
      case 'product':
        return ProductsMajor;
      default:
        return CircleInformationMajor;
    }
  };

  const getActivityStatus = (status: string) => {
    switch (status) {
      case 'success':
        return { tone: 'success' as const, icon: CircleTickMajor, label: 'Succès' };
      case 'pending':
        return { tone: 'warning' as const, icon: CircleAlertMajor, label: 'En attente' };
      case 'error':
        return { tone: 'critical' as const, icon: CircleDisabledMajor, label: 'Erreur' };
      default:
        return { tone: 'info' as const, icon: CircleInformationMajor, label: 'Information' };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <Frame>
        <Page title="Luneo - Tableau de bord">
          <Layout>
            <Layout.Section>
              <Card>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Spinner size="large" />
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Chargement des données...
                  </Text>
                </div>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      </Frame>
    );
  }

  return (
    <Frame>
      <Page
        title="Luneo - Tableau de bord"
        subtitle={`Bienvenue dans votre espace Luneo, ${context.shop?.name || 'Shop'}`}
        primaryAction={{
          content: 'Configurer',
          icon: SettingsMajor,
          onAction: handleSettingsClick,
        }}
        secondaryActions={[
          {
            content: 'Facturation',
            icon: BillingStatementDollarMajor,
            onAction: handleBillingClick,
          },
          {
            content: 'Aide',
            icon: QuestionMarkMajor,
            onAction: () => actions.navigate('/help'),
          },
        ]}
      >
        <Layout>
          {/* Statistiques principales */}
          <Layout.Section>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
              }}
            >
              <Card>
                <div style={{ padding: '1.5rem' }}>
                  <Text variant="headingLg" as="h2">
                    Statistiques Shopify
                  </Text>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      marginTop: '1rem',
                    }}
                  >
                    <div>
                      <Text variant="headingMd" as="h3">
                        {stats?.totalProducts || 0}
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Produits
                      </Text>
                    </div>
                    <div>
                      <Text variant="headingMd" as="h3">
                        {stats?.totalOrders || 0}
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Commandes
                      </Text>
                    </div>
                    <div>
                      <Text variant="headingMd" as="h3">
                        {stats?.totalCustomers || 0}
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Clients
                      </Text>
                    </div>
                    <div>
                      <Text variant="headingMd" as="h3">
                        {formatCurrency(stats?.totalRevenue || 0)}
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Chiffre d’affaires
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div style={{ padding: '1.5rem' }}>
                  <Text variant="headingLg" as="h2">
                    Statistiques Luneo
                  </Text>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      marginTop: '1rem',
                    }}
                  >
                    <div>
                      <Text variant="headingMd" as="h3">
                        {stats?.aiGenerations || 0}
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Générations IA
                      </Text>
                    </div>
                    <div>
                      <Text variant="headingMd" as="h3">
                        {stats?.arViews || 0}
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Vues AR
                      </Text>
                    </div>
                    <div>
                      <Text variant="headingMd" as="h3">
                        {stats?.widgetEmbeds || 0}
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Widgets intégrés
                      </Text>
                    </div>
                    <div>
                    <Badge tone="success">
                        Actif
                      </Badge>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        Statut
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Layout.Section>

          {/* Actions rapides */}
          <Layout.Section>
            <Card>
              <div style={{ padding: '1.5rem' }}>
                <Text variant="headingLg" as="h2" tone="subdued">
                  Actions rapides
                </Text>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginTop: '1rem',
                  }}
                >
                  <Button
                    size="large"
                    icon={StarFilledMinor}
                    onClick={() => handleQuickAction('ai_studio')}
                  >
                    Studio IA
                  </Button>
                  <Button
                    size="large"
                    icon={ViewMajor}
                    onClick={() => handleQuickAction('ar_viewer')}
                  >
                    Visualiseur AR
                  </Button>
                  <Button
                    size="large"
                    icon={AddMajor}
                    onClick={() => handleQuickAction('widget_config')}
                  >
                    Configurer Widget
                  </Button>
                  <Button
                    size="large"
                    icon={AnalyticsMajor}
                    onClick={() => handleQuickAction('analytics')}
                  >
                    Analytics
                  </Button>
                </div>
              </div>
            </Card>
          </Layout.Section>

          {/* Activité récente */}
          <Layout.Section>
            <Card>
              <div style={{ padding: '1.5rem' }}>
                <Text variant="headingLg" as="h2" tone="subdued">
                  Activité récente
                </Text>
                <div style={{ paddingTop: '1rem' }}>
                <ResourceList
                  items={recentActivity}
                  renderItem={(item) => {
                    const { id, type, title, description, timestamp, status } = item;
                    const ActivityIcon = getActivityIcon(type);
                    const statusInfo = getActivityStatus(status);
                    
                    return (
                      <ResourceItem
                        id={id}
                        media={<ActivityIcon />}
                        accessibilityLabel={`${title} - ${description}`}
                        onClick={() => actions.navigate('/analytics/activity')}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Text variant="bodyMd" as="h3">
                              {title}
                            </Text>
                            <Text variant="bodyMd" as="p" tone="subdued">
                              {description}
                            </Text>
                            <Text variant="bodyMd" as="p" tone="subdued">
                              {formatDate(timestamp)}
                            </Text>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <PolarisIcon source={statusInfo.icon} />
                            <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
                          </div>
                        </div>
                      </ResourceItem>
                    );
                  }}
                />
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Modals */}
        {showSettingsModal && (
          <Modal
            open={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            title="Configuration Luneo"
            primaryAction={{
              content: 'Sauvegarder',
              onAction: () => {
                setShowSettingsModal(false);
                actions.showToast('Configuration sauvegardée', 'success');
              },
            }}
            secondaryActions={[
              {
                content: 'Annuler',
                onAction: () => setShowSettingsModal(false),
              },
            ]}
          >
            <Modal.Section>
              <Form onSubmit={() => {}}>
                <FormLayout>
                  <TextField
                    label="Nom de l'application"
                    value="Luneo"
                    onChange={() => {}}
                    autoComplete="off"
                  />
                  <Select
                    label="Plan"
                    options={[
                      { label: 'Starter', value: 'starter' },
                      { label: 'Pro', value: 'pro' },
                      { label: 'Enterprise', value: 'enterprise' },
                    ]}
                    value="starter"
                    onChange={() => {}}
                  />
                  <Checkbox
                    label="Activer les notifications"
                    checked={true}
                    onChange={() => {}}
                  />
                </FormLayout>
              </Form>
            </Modal.Section>
          </Modal>
        )}

        {showBillingModal && (
          <Modal
            open={showBillingModal}
            onClose={() => setShowBillingModal(false)}
            title="Facturation"
            primaryAction={{
              content: 'Fermer',
              onAction: () => setShowBillingModal(false),
            }}
          >
            <Modal.Section>
              <Text variant="bodyMd" as="p">
                Gestion de la facturation et des abonnements Luneo.
              </Text>
              <div style={{ marginTop: '1rem' }}>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowBillingModal(false);
                    actions.navigate('/billing');
                  }}
                >
                  Voir la facturation
                </Button>
              </div>
            </Modal.Section>
          </Modal>
        )}

        {/* Toast */}
        {toast && (
          <Toast
            content={toast.content}
            error={toast.isError}
            onDismiss={() => setToast(null)}
          />
        )}
      </Page>
    </Frame>
  );
};

// Wrapper avec App Bridge Provider
const DashboardPageWithProvider: React.FC = () => {
  return (
    <AppBridgeProvider>
      <AppProvider i18n={frTranslations}>
        <DashboardPage />
      </AppProvider>
    </AppBridgeProvider>
  );
};

export default DashboardPageWithProvider;



