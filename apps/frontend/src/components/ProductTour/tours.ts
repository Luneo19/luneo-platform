/**
 * Predefined Tours
 * O-006: Tours prédéfinis pour Luneo
 */

import type { Tour } from './types';

export const DASHBOARD_TOUR: Tour = {
  id: 'dashboard-intro',
  name: 'Découverte du Dashboard',
  description: 'Apprenez à naviguer dans votre espace de travail',
  trigger: 'first_visit',
  showOnRoutes: ['/dashboard', '/dashboard/overview'],
  steps: [
    {
      id: 'welcome',
      target: '[data-tour="dashboard-header"]',
      title: '👋 Bienvenue sur Luneo !',
      content: 'Voici votre tableau de bord. C\'est ici que vous gérez tous vos projets de personnalisation.',
      placement: 'bottom',
    },
    {
      id: 'sidebar',
      target: '[data-tour="sidebar"]',
      title: '📁 Navigation',
      content: 'Utilisez la barre latérale pour accéder à vos designs, produits, analytics et paramètres.',
      placement: 'right',
    },
    {
      id: 'create-design',
      target: '[data-tour="create-design-btn"]',
      title: '✨ Créer un Design',
      content: 'Cliquez ici pour créer votre premier design personnalisable. C\'est le point de départ de toute personnalisation.',
      placement: 'bottom',
      action: {
        label: 'Créer maintenant',
      },
    },
    {
      id: 'stats',
      target: '[data-tour="stats-cards"]',
      title: '📊 Statistiques',
      content: 'Suivez vos performances en temps réel : designs créés, conversions, revenus et plus encore.',
      placement: 'top',
    },
    {
      id: 'help',
      target: '[data-tour="help-btn"]',
      title: '💡 Besoin d\'aide ?',
      content: 'Accédez à la documentation, tutoriels et support à tout moment. Nous sommes là pour vous !',
      placement: 'left',
    },
  ],
};

export const CUSTOMIZER_TOUR: Tour = {
  id: 'customizer-intro',
  name: 'Maîtriser l\'Éditeur',
  description: 'Découvrez toutes les fonctionnalités de personnalisation',
  trigger: 'first_visit',
  showOnRoutes: ['/dashboard/customizer', '/dashboard/editor'],
  steps: [
    {
      id: 'canvas',
      target: '[data-tour="canvas"]',
      title: '🎨 Zone de Travail',
      content: 'C\'est ici que la magie opère ! Glissez-déposez des éléments, redimensionnez et positionnez-les librement.',
      placement: 'right',
    },
    {
      id: 'toolbar',
      target: '[data-tour="toolbar"]',
      title: '🛠️ Barre d\'Outils',
      content: 'Accédez à tous les outils : texte, images, formes, calques et plus encore.',
      placement: 'bottom',
    },
    {
      id: 'layers',
      target: '[data-tour="layers-panel"]',
      title: '📚 Panneau Calques',
      content: 'Gérez l\'ordre et la visibilité de vos éléments. Réorganisez-les par glisser-déposer.',
      placement: 'left',
    },
    {
      id: 'properties',
      target: '[data-tour="properties-panel"]',
      title: '⚙️ Propriétés',
      content: 'Ajustez les détails : couleurs, polices, tailles, effets et transformations.',
      placement: 'left',
    },
    {
      id: 'preview',
      target: '[data-tour="preview-btn"]',
      title: '👁️ Prévisualisation',
      content: 'Visualisez le rendu final avant d\'exporter. Testez sur différents produits.',
      placement: 'bottom',
    },
    {
      id: 'export',
      target: '[data-tour="export-btn"]',
      title: '📤 Export',
      content: 'Exportez en haute résolution (PDF, PNG, SVG) ou directement vers l\'impression.',
      placement: 'left',
    },
  ],
};

export const ANALYTICS_TOUR: Tour = {
  id: 'analytics-intro',
  name: 'Comprendre vos Analytics',
  description: 'Exploitez vos données pour optimiser vos conversions',
  trigger: 'manual',
  showOnRoutes: ['/dashboard/analytics', '/dashboard/analytics-advanced'],
  steps: [
    {
      id: 'metrics',
      target: '[data-tour="metrics-cards"]',
      title: '📈 Métriques Clés',
      content: 'Ces KPIs vous donnent une vue rapide de vos performances : revenus, conversions, designs créés.',
      placement: 'bottom',
    },
    {
      id: 'charts',
      target: '[data-tour="charts"]',
      title: '📊 Graphiques',
      content: 'Visualisez l\'évolution de vos métriques dans le temps. Identifiez les tendances.',
      placement: 'top',
    },
    {
      id: 'funnel',
      target: '[data-tour="funnel"]',
      title: '🎯 Funnel de Conversion',
      content: 'Analysez chaque étape du parcours client. Identifiez où vous perdez des visiteurs.',
      placement: 'right',
    },
    {
      id: 'export',
      target: '[data-tour="export-btn"]',
      title: '📥 Export',
      content: 'Exportez vos rapports en CSV ou PDF pour vos réunions et analyses approfondies.',
      placement: 'bottom',
    },
  ],
};

export const AB_TESTING_TOUR: Tour = {
  id: 'ab-testing-intro',
  name: 'A/B Testing',
  description: 'Créez des expériences pour optimiser vos conversions',
  trigger: 'manual',
  showOnRoutes: ['/dashboard/ab-testing'],
  steps: [
    {
      id: 'create',
      target: '[data-tour="create-experiment"]',
      title: '🧪 Créer une Expérience',
      content: 'Lancez un test A/B en définissant vos variantes et la métrique à optimiser.',
      placement: 'bottom',
    },
    {
      id: 'variants',
      target: '[data-tour="variants"]',
      title: '🔀 Variantes',
      content: 'Comparez différentes versions de vos designs, CTAs ou pages pour trouver ce qui fonctionne le mieux.',
      placement: 'right',
    },
    {
      id: 'results',
      target: '[data-tour="results"]',
      title: '📊 Résultats',
      content: 'Suivez les performances en temps réel. Le système calcule automatiquement la significativité statistique.',
      placement: 'top',
    },
    {
      id: 'winner',
      target: '[data-tour="declare-winner"]',
      title: '🏆 Déclarer le Gagnant',
      content: 'Quand la confiance atteint 95%+, déployez automatiquement la variante gagnante.',
      placement: 'left',
    },
  ],
};

export const INTEGRATIONS_TOUR: Tour = {
  id: 'integrations-intro',
  name: 'Intégrations',
  description: 'Connectez Luneo à vos outils existants',
  trigger: 'manual',
  showOnRoutes: ['/dashboard/integrations', '/dashboard/integrations-dashboard'],
  steps: [
    {
      id: 'available',
      target: '[data-tour="available-integrations"]',
      title: '🔌 Intégrations Disponibles',
      content: 'Connectez Shopify, WooCommerce, Magento et plus encore en quelques clics.',
      placement: 'bottom',
    },
    {
      id: 'api',
      target: '[data-tour="api-keys"]',
      title: '🔑 Clés API',
      content: 'Générez des clés API pour intégrer Luneo dans votre application personnalisée.',
      placement: 'right',
    },
    {
      id: 'webhooks',
      target: '[data-tour="webhooks"]',
      title: '🪝 Webhooks',
      content: 'Recevez des notifications en temps réel quand un design est créé ou une commande est passée.',
      placement: 'top',
    },
  ],
};

// Export all tours
export const ALL_TOURS: Tour[] = [
  DASHBOARD_TOUR,
  CUSTOMIZER_TOUR,
  ANALYTICS_TOUR,
  AB_TESTING_TOUR,
  INTEGRATIONS_TOUR,
];

export const getTourById = (id: string): Tour | undefined => {
  return ALL_TOURS.find(tour => tour.id === id);
};

export const getToursForRoute = (route: string): Tour[] => {
  return ALL_TOURS.filter(tour => 
    tour.showOnRoutes?.some(r => route.startsWith(r))
  );
};


