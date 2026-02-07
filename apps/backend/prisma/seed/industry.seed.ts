import type { PrismaClient } from '@prisma/client';
import { ModulePriority } from '@prisma/client';

/** KPI slug -> labels and icon for IndustryKpiConfig */
const KPI_LABELS: Record<
  string,
  { labelFr: string; labelEn: string; icon: string }
> = {
  'ar-sessions-today': {
    labelFr: "Sessions AR aujourd'hui",
    labelEn: 'AR sessions today',
    icon: 'camera',
  },
  'conversion-rate-ar': {
    labelFr: 'Taux de conversion AR',
    labelEn: 'AR conversion rate',
    icon: 'trending-up',
  },
  'designs-generated': {
    labelFr: 'Designs générés',
    labelEn: 'Designs generated',
    icon: 'palette',
  },
  'orders-pending': {
    labelFr: 'Commandes en attente',
    labelEn: 'Pending orders',
    icon: 'clock',
  },
  'monthly-revenue': {
    labelFr: "Chiffre d'affaires mensuel",
    labelEn: 'Monthly revenue',
    icon: 'dollar-sign',
  },
  'top-frames-tried': {
    labelFr: 'Montures les plus essayées',
    labelEn: 'Top frames tried',
    icon: 'glasses',
  },
  'return-rate-reduction': {
    labelFr: 'Réduction des retours',
    labelEn: 'Return rate reduction',
    icon: 'trending-down',
  },
  '3d-views-today': {
    labelFr: 'Vues 3D aujourd\'hui',
    labelEn: '3D views today',
    icon: 'box',
  },
  'configs-saved': {
    labelFr: 'Configs enregistrées',
    labelEn: 'Configs saved',
    icon: 'save',
  },
  'conversion-rate': {
    labelFr: 'Taux de conversion',
    labelEn: 'Conversion rate',
    icon: 'trending-up',
  },
  'shades-tested': {
    labelFr: 'Nuances testées',
    labelEn: 'Shades tested',
    icon: 'palette',
  },
  'orders-in-production': {
    labelFr: 'Commandes en production',
    labelEn: 'Orders in production',
    icon: 'factory',
  },
  'exports-generated': {
    labelFr: 'Exports générés',
    labelEn: 'Exports generated',
    icon: 'download',
  },
  'avg-production-time': {
    labelFr: 'Délai moyen de production',
    labelEn: 'Avg production time',
    icon: 'clock',
  },
  'customizations-completed': {
    labelFr: 'Personnalisations terminées',
    labelEn: 'Customizations completed',
    icon: 'check',
  },
  'customizations-created': {
    labelFr: 'Personnalisations créées',
    labelEn: 'Customizations created',
    icon: 'sparkles',
  },
  'gift-orders': {
    labelFr: 'Commandes cadeaux',
    labelEn: 'Gift orders',
    icon: 'gift',
  },
  'popular-designs': {
    labelFr: 'Designs populaires',
    labelEn: 'Popular designs',
    icon: 'trending-up',
  },
  'seasonal-revenue': {
    labelFr: 'CA saisonnier',
    labelEn: 'Seasonal revenue',
    icon: 'calendar',
  },
  'team-orders': {
    labelFr: 'Commandes équipes',
    labelEn: 'Team orders',
    icon: 'users',
  },
};

type ModuleEntry = { slug: string; priority: ModulePriority; defaultSettings?: Record<string, unknown> };
type WidgetEntry = { slug: string; position: number };
type TerminologyEntry = { genericTerm: string; customTermFr: string; customTermEn: string; context?: string };
type OnboardingEntry = { stepOrder: number; titleFr: string; titleEn: string; descriptionFr?: string; descriptionEn?: string };

interface IndustrySeedDef {
  slug: string;
  labelFr: string;
  labelEn: string;
  icon: string;
  accentColor: string;
  sortOrder: number;
  modules: ModuleEntry[];
  widgets: WidgetEntry[];
  kpis: string[];
  templates: string[];
  terminology: TerminologyEntry[];
  onboarding: OnboardingEntry[];
}

const INDUSTRIES: IndustrySeedDef[] = [
  {
    slug: 'jewelry',
    labelFr: 'Bijouterie & Joaillerie',
    labelEn: 'Jewelry & Accessories',
    icon: 'gem',
    accentColor: '#D4AF37',
    sortOrder: 1,
    modules: [
      { slug: 'ar-studio', priority: ModulePriority.PRIMARY },
      { slug: 'configurator-3d', priority: ModulePriority.PRIMARY },
      { slug: 'ai-studio', priority: ModulePriority.PRIMARY },
      { slug: 'products', priority: ModulePriority.PRIMARY },
      { slug: 'editor-2d', priority: ModulePriority.SECONDARY },
      { slug: 'orders', priority: ModulePriority.SECONDARY },
      { slug: 'analytics', priority: ModulePriority.SECONDARY },
      { slug: 'marketplace', priority: ModulePriority.AVAILABLE },
    ],
    widgets: [
      { slug: 'ar-performance', position: 1 },
      { slug: '3d-views', position: 2 },
      { slug: 'ai-generations', position: 3 },
      { slug: 'recent-orders', position: 4 },
      { slug: 'revenue-chart', position: 5 },
    ],
    kpis: ['ar-sessions-today', 'conversion-rate-ar', 'designs-generated', 'orders-pending', 'monthly-revenue'],
    templates: ['Bague', 'Collier', 'Bracelet', "Boucles d'oreilles", 'Montre'],
    terminology: [
      { genericTerm: 'product', customTermFr: 'pièce', customTermEn: 'piece' },
      { genericTerm: 'design', customTermFr: 'modèle', customTermEn: 'model' },
      { genericTerm: 'order', customTermFr: 'commande', customTermEn: 'order' },
      { genericTerm: 'collection', customTermFr: 'collection', customTermEn: 'collection' },
      { genericTerm: 'try-on', customTermFr: 'essayage virtuel', customTermEn: 'virtual try-on' },
    ],
    onboarding: [
      { stepOrder: 1, titleFr: 'Essayage AR bijoux', titleEn: 'AR try-on for jewelry', descriptionFr: 'Découvrez l\'essayage virtuel de vos créations.', descriptionEn: 'Discover virtual try-on for your creations.' },
      { stepOrder: 2, titleFr: 'Configurer l\'AR', titleEn: 'Configure AR', descriptionFr: 'Paramétrez les modèles 3D et l\'expérience client.', descriptionEn: 'Set up 3D models and customer experience.' },
      { stepOrder: 3, titleFr: 'Lancer votre boutique', titleEn: 'Launch your store', descriptionFr: 'Publiez vos pièces et partagez l\'essayage AR.', descriptionEn: 'Publish your pieces and share AR try-on.' },
    ],
  },
  {
    slug: 'eyewear',
    labelFr: 'Optique & Lunetterie',
    labelEn: 'Eyewear & Optics',
    icon: 'glasses',
    accentColor: '#4A90D9',
    sortOrder: 2,
    modules: [
      { slug: 'ar-studio', priority: ModulePriority.PRIMARY, defaultSettings: { tracking: 'face' } },
      { slug: 'configurator-3d', priority: ModulePriority.PRIMARY },
      { slug: 'products', priority: ModulePriority.PRIMARY },
      { slug: 'ai-studio', priority: ModulePriority.SECONDARY },
      { slug: 'orders', priority: ModulePriority.SECONDARY },
      { slug: 'analytics', priority: ModulePriority.SECONDARY },
      { slug: 'editor-2d', priority: ModulePriority.AVAILABLE },
      { slug: 'marketplace', priority: ModulePriority.AVAILABLE },
    ],
    widgets: [
      { slug: 'ar-performance', position: 1 },
      { slug: 'face-tracking-stats', position: 2 },
      { slug: 'top-products', position: 3 },
      { slug: 'returns-reduction', position: 4 },
      { slug: 'revenue-chart', position: 5 },
    ],
    kpis: ['ar-sessions-today', 'conversion-rate-ar', 'top-frames-tried', 'return-rate-reduction', 'monthly-revenue'],
    templates: ['Monture ronde', 'Monture carrée', 'Monture aviateur', 'Solaires', 'Sport'],
    terminology: [
      { genericTerm: 'product', customTermFr: 'monture', customTermEn: 'frame' },
      { genericTerm: 'design', customTermFr: 'modèle', customTermEn: 'model' },
      { genericTerm: 'try-on', customTermFr: 'essayage virtuel', customTermEn: 'virtual try-on' },
    ],
    onboarding: [],
  },
  {
    slug: 'fashion',
    labelFr: 'Mode & Vêtements',
    labelEn: 'Fashion & Apparel',
    icon: 'shirt',
    accentColor: '#E91E63',
    sortOrder: 3,
    modules: [
      { slug: 'ar-studio', priority: ModulePriority.PRIMARY, defaultSettings: { tracking: 'body' } },
      { slug: 'ai-studio', priority: ModulePriority.PRIMARY },
      { slug: 'editor-2d', priority: ModulePriority.PRIMARY },
      { slug: 'products', priority: ModulePriority.PRIMARY },
      { slug: 'configurator-3d', priority: ModulePriority.SECONDARY },
      { slug: 'orders', priority: ModulePriority.SECONDARY },
      { slug: 'analytics', priority: ModulePriority.SECONDARY },
      { slug: 'marketplace', priority: ModulePriority.SECONDARY },
    ],
    widgets: [
      { slug: 'ai-generations', position: 1 },
      { slug: 'ar-performance', position: 2 },
      { slug: 'customization-funnel', position: 3 },
      { slug: 'recent-orders', position: 4 },
      { slug: 'revenue-chart', position: 5 },
    ],
    kpis: ['designs-generated', 'ar-sessions-today', 'customizations-completed', 'orders-pending', 'monthly-revenue'],
    templates: ['T-shirt', 'Hoodie', 'Casquette', 'Sneakers', 'Sac'],
    terminology: [
      { genericTerm: 'product', customTermFr: 'article', customTermEn: 'item' },
      { genericTerm: 'design', customTermFr: 'motif', customTermEn: 'pattern' },
      { genericTerm: 'collection', customTermFr: 'collection', customTermEn: 'collection' },
    ],
    onboarding: [],
  },
  {
    slug: 'print_on_demand',
    labelFr: 'Impression & Personnalisation',
    labelEn: 'Print-on-Demand & Custom Products',
    icon: 'printer',
    accentColor: '#FF6B35',
    sortOrder: 4,
    modules: [
      { slug: 'editor-2d', priority: ModulePriority.PRIMARY },
      { slug: 'ai-studio', priority: ModulePriority.PRIMARY },
      { slug: 'products', priority: ModulePriority.PRIMARY },
      { slug: 'orders', priority: ModulePriority.PRIMARY },
      { slug: 'configurator-3d', priority: ModulePriority.SECONDARY },
      { slug: 'analytics', priority: ModulePriority.SECONDARY },
      { slug: 'marketplace', priority: ModulePriority.SECONDARY },
      { slug: 'ar-studio', priority: ModulePriority.AVAILABLE },
    ],
    widgets: [
      { slug: 'production-pipeline', position: 1 },
      { slug: 'ai-generations', position: 2 },
      { slug: 'recent-orders', position: 3 },
      { slug: 'top-products', position: 4 },
      { slug: 'revenue-chart', position: 5 },
    ],
    kpis: ['designs-generated', 'orders-in-production', 'exports-generated', 'monthly-revenue', 'avg-production-time'],
    templates: ['Mug', 'Poster', 'Coque téléphone', 'Tote bag', 'Sticker'],
    terminology: [
      { genericTerm: 'product', customTermFr: 'produit', customTermEn: 'product' },
      { genericTerm: 'design', customTermFr: 'visuel', customTermEn: 'design' },
      { genericTerm: 'order', customTermFr: 'commande de production', customTermEn: 'production order' },
    ],
    onboarding: [],
  },
  {
    slug: 'home_decor',
    labelFr: 'Décoration & Mobilier',
    labelEn: 'Home Decor & Furniture',
    icon: 'sofa',
    accentColor: '#8B7355',
    sortOrder: 5,
    modules: [
      { slug: 'configurator-3d', priority: ModulePriority.PRIMARY },
      { slug: 'ai-studio', priority: ModulePriority.PRIMARY },
      { slug: 'products', priority: ModulePriority.PRIMARY },
      { slug: 'ar-studio', priority: ModulePriority.SECONDARY },
      { slug: 'editor-2d', priority: ModulePriority.SECONDARY },
      { slug: 'orders', priority: ModulePriority.SECONDARY },
      { slug: 'analytics', priority: ModulePriority.SECONDARY },
      { slug: 'marketplace', priority: ModulePriority.AVAILABLE },
    ],
    widgets: [
      { slug: '3d-views', position: 1 },
      { slug: 'ar-performance', position: 2 },
      { slug: 'ai-generations', position: 3 },
      { slug: 'recent-orders', position: 4 },
      { slug: 'revenue-chart', position: 5 },
    ],
    kpis: ['3d-views-today', 'configs-saved', 'conversion-rate', 'orders-pending', 'monthly-revenue'],
    templates: ['Chaise', 'Table', 'Lampe', 'Cadre', 'Coussin'],
    terminology: [
      { genericTerm: 'product', customTermFr: 'article', customTermEn: 'item' },
      { genericTerm: 'design', customTermFr: 'modèle', customTermEn: 'model' },
      { genericTerm: 'configuration', customTermFr: 'personnalisation', customTermEn: 'customization' },
    ],
    onboarding: [],
  },
  {
    slug: 'beauty',
    labelFr: 'Beauté & Cosmétiques',
    labelEn: 'Beauty & Cosmetics',
    icon: 'sparkles',
    accentColor: '#FF69B4',
    sortOrder: 6,
    modules: [
      { slug: 'ar-studio', priority: ModulePriority.PRIMARY, defaultSettings: { tracking: 'face', mode: 'makeup' } },
      { slug: 'ai-studio', priority: ModulePriority.PRIMARY },
      { slug: 'products', priority: ModulePriority.PRIMARY },
      { slug: 'configurator-3d', priority: ModulePriority.SECONDARY },
      { slug: 'editor-2d', priority: ModulePriority.SECONDARY },
      { slug: 'orders', priority: ModulePriority.SECONDARY },
      { slug: 'analytics', priority: ModulePriority.SECONDARY },
      { slug: 'marketplace', priority: ModulePriority.AVAILABLE },
    ],
    widgets: [
      { slug: 'ar-performance', position: 1 },
      { slug: 'top-products', position: 2 },
      { slug: 'ai-generations', position: 3 },
      { slug: 'recent-orders', position: 4 },
      { slug: 'revenue-chart', position: 5 },
    ],
    kpis: ['ar-sessions-today', 'shades-tested', 'conversion-rate-ar', 'orders-pending', 'monthly-revenue'],
    templates: ['Rouge à lèvres', 'Fond de teint', 'Palette', 'Mascara', 'Vernis'],
    terminology: [
      { genericTerm: 'product', customTermFr: 'produit', customTermEn: 'product' },
      { genericTerm: 'design', customTermFr: 'nuance', customTermEn: 'shade' },
      { genericTerm: 'try-on', customTermFr: 'essayage maquillage', customTermEn: 'makeup try-on' },
    ],
    onboarding: [],
  },
  {
    slug: 'gifts',
    labelFr: 'Cadeaux & Événementiel',
    labelEn: 'Gifts & Events',
    icon: 'gift',
    accentColor: '#9B59B6',
    sortOrder: 7,
    modules: [
      { slug: 'editor-2d', priority: ModulePriority.PRIMARY },
      { slug: 'ai-studio', priority: ModulePriority.PRIMARY },
      { slug: 'products', priority: ModulePriority.PRIMARY },
      { slug: 'orders', priority: ModulePriority.PRIMARY },
      { slug: 'configurator-3d', priority: ModulePriority.SECONDARY },
      { slug: 'analytics', priority: ModulePriority.SECONDARY },
      { slug: 'marketplace', priority: ModulePriority.SECONDARY },
      { slug: 'ar-studio', priority: ModulePriority.AVAILABLE },
    ],
    widgets: [
      { slug: 'customization-funnel', position: 1 },
      { slug: 'ai-generations', position: 2 },
      { slug: 'recent-orders', position: 3 },
      { slug: 'top-products', position: 4 },
      { slug: 'revenue-chart', position: 5 },
    ],
    kpis: ['customizations-created', 'gift-orders', 'popular-designs', 'seasonal-revenue', 'monthly-revenue'],
    templates: ['Carte cadeau', 'Mug personnalisé', 'Photo sur toile', 'Calendrier', 'Coussin photo'],
    terminology: [
      { genericTerm: 'product', customTermFr: 'cadeau', customTermEn: 'gift' },
      { genericTerm: 'design', customTermFr: 'création', customTermEn: 'creation' },
      { genericTerm: 'order', customTermFr: 'commande cadeau', customTermEn: 'gift order' },
    ],
    onboarding: [],
  },
  {
    slug: 'sports',
    labelFr: 'Sport & Équipement',
    labelEn: 'Sports & Equipment',
    icon: 'trophy',
    accentColor: '#27AE60',
    sortOrder: 8,
    modules: [
      { slug: 'editor-2d', priority: ModulePriority.PRIMARY },
      { slug: 'configurator-3d', priority: ModulePriority.PRIMARY },
      { slug: 'ai-studio', priority: ModulePriority.PRIMARY },
      { slug: 'products', priority: ModulePriority.PRIMARY },
      { slug: 'ar-studio', priority: ModulePriority.SECONDARY },
      { slug: 'orders', priority: ModulePriority.SECONDARY },
      { slug: 'analytics', priority: ModulePriority.SECONDARY },
      { slug: 'marketplace', priority: ModulePriority.AVAILABLE },
    ],
    widgets: [
      { slug: 'ai-generations', position: 1 },
      { slug: '3d-views', position: 2 },
      { slug: 'customization-funnel', position: 3 },
      { slug: 'recent-orders', position: 4 },
      { slug: 'revenue-chart', position: 5 },
    ],
    kpis: ['designs-generated', '3d-views-today', 'team-orders', 'orders-pending', 'monthly-revenue'],
    templates: ['Maillot', 'Short', 'Ballon', 'Chaussure', 'Équipement'],
    terminology: [
      { genericTerm: 'product', customTermFr: 'article', customTermEn: 'item' },
      { genericTerm: 'design', customTermFr: 'motif', customTermEn: 'pattern' },
      { genericTerm: 'order', customTermFr: 'commande équipe', customTermEn: 'team order' },
    ],
    onboarding: [],
  },
  {
    slug: 'other',
    labelFr: 'Autre secteur',
    labelEn: 'Other',
    icon: 'layout-grid',
    accentColor: '#6B7280',
    sortOrder: 9,
    modules: [
      { slug: 'ar-studio', priority: ModulePriority.AVAILABLE },
      { slug: 'configurator-3d', priority: ModulePriority.AVAILABLE },
      { slug: 'ai-studio', priority: ModulePriority.AVAILABLE },
      { slug: 'products', priority: ModulePriority.AVAILABLE },
      { slug: 'editor-2d', priority: ModulePriority.AVAILABLE },
      { slug: 'orders', priority: ModulePriority.AVAILABLE },
      { slug: 'analytics', priority: ModulePriority.AVAILABLE },
      { slug: 'marketplace', priority: ModulePriority.AVAILABLE },
    ],
    widgets: [
      { slug: 'ar-performance', position: 1 },
      { slug: '3d-views', position: 2 },
      { slug: 'ai-generations', position: 3 },
      { slug: 'recent-orders', position: 4 },
      { slug: 'revenue-chart', position: 5 },
      { slug: 'face-tracking-stats', position: 6 },
      { slug: 'top-products', position: 7 },
      { slug: 'returns-reduction', position: 8 },
      { slug: 'customization-funnel', position: 9 },
      { slug: 'production-pipeline', position: 10 },
    ],
    kpis: ['monthly-revenue', 'orders-pending', 'conversion-rate', 'designs-generated', 'ar-sessions-today'],
    templates: [],
    terminology: [],
    onboarding: [],
  },
];

/** Idempotent industry seed. Uses upsert for Industry and all child configs; templates are replaced per industry. */
export async function seedIndustries(prisma: PrismaClient): Promise<void> {
  for (let i = 0; i < INDUSTRIES.length; i++) {
    const def = INDUSTRIES[i];

    const industry = await prisma.industry.upsert({
      where: { slug: def.slug },
      update: {
        labelFr: def.labelFr,
        labelEn: def.labelEn,
        icon: def.icon,
        accentColor: def.accentColor,
        sortOrder: def.sortOrder,
      },
      create: {
        slug: def.slug,
        labelFr: def.labelFr,
        labelEn: def.labelEn,
        icon: def.icon,
        accentColor: def.accentColor,
        sortOrder: def.sortOrder,
      },
    });

    // Upsert module configs: only the ones in def.modules (for "other", all are AVAILABLE in the list)
    for (let s = 0; s < def.modules.length; s++) {
      const m = def.modules[s];
      await prisma.industryModuleConfig.upsert({
        where: {
          industryId_moduleSlug: { industryId: industry.id, moduleSlug: m.slug },
        },
        update: {
          priority: m.priority,
          sortOrder: s,
          defaultSettings: m.defaultSettings ?? undefined,
        },
        create: {
          industryId: industry.id,
          moduleSlug: m.slug,
          priority: m.priority,
          sortOrder: s,
          defaultSettings: m.defaultSettings ?? undefined,
        },
      });
    }

    // "other" has only the 8 modules in def.modules; no need to add more. All others have explicit lists.

    // Upsert widget configs
    for (const w of def.widgets) {
      await prisma.industryWidgetConfig.upsert({
        where: {
          industryId_widgetSlug: { industryId: industry.id, widgetSlug: w.slug },
        },
        update: { position: w.position },
        create: {
          industryId: industry.id,
          widgetSlug: w.slug,
          position: w.position,
        },
      });
    }

    // Upsert KPI configs
    for (let k = 0; k < def.kpis.length; k++) {
      const kpiSlug = def.kpis[k];
      const labels = KPI_LABELS[kpiSlug] ?? {
        labelFr: kpiSlug,
        labelEn: kpiSlug,
        icon: 'bar-chart',
      };
      await prisma.industryKpiConfig.upsert({
        where: {
          industryId_kpiSlug: { industryId: industry.id, kpiSlug },
        },
        update: {
          labelFr: labels.labelFr,
          labelEn: labels.labelEn,
          icon: labels.icon,
          sortOrder: k,
        },
        create: {
          industryId: industry.id,
          kpiSlug,
          labelFr: labels.labelFr,
          labelEn: labels.labelEn,
          icon: labels.icon,
          sortOrder: k,
        },
      });
    }

    // Templates: no unique on (industryId, name) → delete then create for idempotency
    await prisma.industryTemplate.deleteMany({ where: { industryId: industry.id } });
    for (let t = 0; t < def.templates.length; t++) {
      await prisma.industryTemplate.create({
        data: {
          industryId: industry.id,
          name: def.templates[t],
          sortOrder: t,
        },
      });
    }

    // Upsert terminology
    for (const term of def.terminology) {
      const context = term.context ?? 'all';
      await prisma.industryTerminology.upsert({
        where: {
          industryId_genericTerm_context: {
            industryId: industry.id,
            genericTerm: term.genericTerm,
            context,
          },
        },
        update: {
          customTermFr: term.customTermFr,
          customTermEn: term.customTermEn,
        },
        create: {
          industryId: industry.id,
          genericTerm: term.genericTerm,
          customTermFr: term.customTermFr,
          customTermEn: term.customTermEn,
          context,
        },
      });
    }

    // Upsert onboarding steps
    for (const step of def.onboarding) {
      await prisma.industryOnboarding.upsert({
        where: {
          industryId_stepOrder: { industryId: industry.id, stepOrder: step.stepOrder },
        },
        update: {
          titleFr: step.titleFr,
          titleEn: step.titleEn,
          descriptionFr: step.descriptionFr ?? undefined,
          descriptionEn: step.descriptionEn ?? undefined,
        },
        create: {
          industryId: industry.id,
          stepOrder: step.stepOrder,
          titleFr: step.titleFr,
          titleEn: step.titleEn,
          descriptionFr: step.descriptionFr ?? undefined,
          descriptionEn: step.descriptionEn ?? undefined,
        },
      });
    }
  }
}
