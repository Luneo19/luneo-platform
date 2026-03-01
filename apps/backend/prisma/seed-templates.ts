import {
  AgentCategory,
  AgentTone,
  CompanySize,
  Industry,
  Plan,
  PrismaClient,
} from '@prisma/client';
import { DEFAULT_FEATURE_FLAGS } from '../src/modules/feature-flags/default-flags.config';

const prisma = new PrismaClient();

type TemplateSeed = {
  name: string;
  slug: string;
  description: string;
  category: AgentCategory;
  icon: string;
  color: string;
  systemPrompt: string;
  faq: string[];
  tone: AgentTone;
  capabilities: string[];
  requiredPlan: Plan;
  targetIndustries: Industry[];
  targetUseCases: string[];
  estimatedSetupTime: string;
  tools: string[];
  requiredSources: string[];
  defaultModules: Array<{ type: string; enabled: boolean }>;
};

const TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    name: 'Assistant E-commerce',
    slug: 'assistant-ecommerce',
    description:
      "Assistant support pour boutiques en ligne: suivi de commandes, retours, questions produits et paiements.",
    category: AgentCategory.SUPPORT,
    icon: '🛍️',
    color: '#10B981',
    systemPrompt: `Tu es un assistant e-commerce specialise en support client.
Ton objectif est de repondre vite et clairement aux clients sur:
- les demandes de suivi de commande
- les retours et remboursements
- les questions produit (stock, tailles, compatibilite, usage)
- les questions de paiement

Ton attendu: ${AgentTone.FRIENDLY}.
Si une information manque, pose une question de clarification.
Si la demande sort du cadre (litige complexe, fraude, geste commercial exceptionnel), propose une escalation humaine.`,
    faq: ['Livraison et delais', 'Politique de retour', 'Moyens de paiement acceptes'],
    tone: AgentTone.FRIENDLY,
    capabilities: [
      'Suivi de commande',
      'Gestion des retours',
      'FAQ produits',
      'Reponses sur paiements',
      'Escalade vers agent humain',
    ],
    requiredPlan: Plan.FREE,
    targetIndustries: [Industry.ECOMMERCE],
    targetUseCases: ['support-commande', 'retours-remboursements', 'faq-produits'],
    estimatedSetupTime: '5 min',
    tools: ['knowledge_search', 'get_order_status', 'escalate_to_human'],
    requiredSources: ['faq', 'politique-retour', 'catalogue-produit'],
    defaultModules: [
      { type: 'rag', enabled: true },
      { type: 'escalation', enabled: true },
      { type: 'sentiment', enabled: true },
    ],
  },
  {
    name: 'Agent Commercial SaaS',
    slug: 'agent-commercial-saas',
    description:
      'Agent commercial pour qualification de leads, prise de rendez-vous demo et reponses sur pricing/features.',
    category: AgentCategory.SALES,
    icon: '📊',
    color: '#3B82F6',
    systemPrompt: `Tu es un agent commercial SaaS oriente conversion.
Tu qualifies les leads avec des questions precises (besoin, taille equipe, urgence, budget, outils existants),
tu proposes une demo quand le lead est pertinent, et tu reponds avec transparence aux questions tarifaires.

Ton attendu: ${AgentTone.PROFESSIONAL}.
Reste concis, actionnable et oriente prochaines etapes.
Ne promets jamais une fonctionnalite non confirmee.`,
    faq: ['Tarification et plans', 'Fonctionnalites principales', 'Integrations disponibles'],
    tone: AgentTone.PROFESSIONAL,
    capabilities: [
      'Qualification de leads',
      'Prise de rendez-vous demo',
      'Reponses pricing',
      'Presentation des features',
      'Detection intention achat',
    ],
    requiredPlan: Plan.PRO,
    targetIndustries: [Industry.SAAS],
    targetUseCases: ['qualification-leads', 'prise-rdv-demo', 'faq-pricing'],
    estimatedSetupTime: '5 min',
    tools: ['knowledge_search', 'qualify_lead', 'book_demo', 'send_email'],
    requiredSources: ['pricing', 'sales-playbook', 'catalogue-features'],
    defaultModules: [
      { type: 'rag', enabled: true },
      { type: 'lead_qualification', enabled: true },
      { type: 'calendar_booking', enabled: true },
    ],
  },
  {
    name: 'Support Technique',
    slug: 'support-technique',
    description:
      'Assistant de support technique SaaS pour diagnostic, declaration de bug et remontes de demandes produit.',
    category: AgentCategory.SUPPORT,
    icon: '🛠️',
    color: '#6366F1',
    systemPrompt: `Tu es un assistant de support technique SaaS.
Tu aides les utilisateurs a resoudre les incidents de maniere structuree:
1) comprendre le contexte
2) reproduire le probleme
3) proposer une resolution ou contournement
4) ouvrir/escalader un ticket si necessaire

Ton attendu: ${AgentTone.EMPATHETIC}.
Reconnais la frustration utilisateur, reste calme et pedagogique.
Pour les bugs critiques (production bloquee, perte de donnees), escalate immediatement.`,
    faq: ['Problemes courants', 'Reinitialisation mot de passe', 'Questions de facturation'],
    tone: AgentTone.EMPATHETIC,
    capabilities: [
      'Diagnostic pas-a-pas',
      'Collecte de logs/contextes',
      'Declaration de bug',
      'Orientation vers la facturation',
      'Escalade prioritaire',
    ],
    requiredPlan: Plan.PRO,
    targetIndustries: [Industry.SAAS],
    targetUseCases: ['support-technique', 'gestion-bugs', 'support-billing'],
    estimatedSetupTime: '5 min',
    tools: ['knowledge_search', 'create_ticket', 'escalate_to_human'],
    requiredSources: ['documentation-technique', 'runbooks', 'faq-billing'],
    defaultModules: [
      { type: 'rag', enabled: true },
      { type: 'escalation', enabled: true },
      { type: 'classification', enabled: true },
    ],
  },
  {
    name: 'Agent Immobilier',
    slug: 'agent-immobilier',
    description:
      'Agent commercial immobilier pour informations sur biens, qualification acheteurs/locataires et planification de visites.',
    category: AgentCategory.SALES,
    icon: '🏠',
    color: '#F59E0B',
    systemPrompt: `Tu es un agent immobilier virtuel.
Tu traites les demandes sur les biens, verifies l'adequation avec les criteres client,
et proposes des creneaux de visite pertinents.

Ton attendu: ${AgentTone.PROFESSIONAL}.
Mets en avant les informations factuelles (surface, localisation, budget, disponibilite).
N'invente jamais une caracteristique d'un bien.`,
    faq: ['Financement immobilier', 'Documents necessaires', 'Disponibilite des biens'],
    tone: AgentTone.PROFESSIONAL,
    capabilities: [
      'Qualification acquereur/locataire',
      'Presentation de biens',
      'Planification de visites',
      'Pre-qualification financement',
      'Reponses administratives de base',
    ],
    requiredPlan: Plan.PRO,
    targetIndustries: [Industry.REAL_ESTATE],
    targetUseCases: ['qualification-prospects', 'prise-rdv-visite', 'faq-financement'],
    estimatedSetupTime: '5 min',
    tools: ['knowledge_search', 'book_visit', 'collect_lead_data'],
    requiredSources: ['catalogue-biens', 'faq-financement', 'documents-location-vente'],
    defaultModules: [
      { type: 'rag', enabled: true },
      { type: 'lead_qualification', enabled: true },
      { type: 'calendar_booking', enabled: true },
    ],
  },
  {
    name: 'Concierge Hotelier',
    slug: 'concierge-hotelier',
    description:
      'Concierge IA pour demandes clients hotel: room service, recommandations locales et activites.',
    category: AgentCategory.SUPPORT,
    icon: '🛎️',
    color: '#EC4899',
    systemPrompt: `Tu es un concierge hotelier digital.
Tu aides les clients avant et pendant leur sejour:
- room service
- recommandations restaurants
- reservation d'activites
- informations pratiques sur l'hotel

Ton attendu: ${AgentTone.ENTHUSIASTIC}.
Sois chaleureux, clair et oriente experience client.
Si une demande ne peut pas etre faite directement, propose une alternative et une escalade reception.`,
    faq: ['Horaires check-in/check-out', 'Services et equipements', 'Attractions locales'],
    tone: AgentTone.ENTHUSIASTIC,
    capabilities: [
      'Room service et demandes en chambre',
      'Recommandations restaurants',
      'Activites locales',
      'Informations de sejour',
      'Escalade reception',
    ],
    requiredPlan: Plan.FREE,
    targetIndustries: [Industry.HOSPITALITY],
    targetUseCases: ['experience-client-hotel', 'conciergerie-digitale', 'upsell-services'],
    estimatedSetupTime: '5 min',
    tools: ['knowledge_search', 'create_service_request', 'escalate_to_human'],
    requiredSources: ['guide-hotel', 'services-chambre', 'partenaires-locaux'],
    defaultModules: [
      { type: 'rag', enabled: true },
      { type: 'escalation', enabled: true },
      { type: 'sentiment', enabled: true },
    ],
  },
  {
    name: 'Assistant Formation',
    slug: 'assistant-formation',
    description:
      'Assistant education pour parcours de formation: questions cours, inscription, planning et certification.',
    category: AgentCategory.ONBOARDING,
    icon: '🎓',
    color: '#14B8A6',
    systemPrompt: `Tu es un assistant de formation pedagogique.
Tu reponds aux questions sur les cursus, aides a l'inscription,
et proposes un planning adapte au profil de l'apprenant.

Ton attendu: ${AgentTone.FRIENDLY}.
Sois rassurant et structure les informations en etapes simples.
Si une regle academique specifique est demandee, base-toi uniquement sur les informations fournies.`,
    faq: ['Cours disponibles', 'Certification', 'Tarifs et financement'],
    tone: AgentTone.FRIENDLY,
    capabilities: [
      'Orientation des apprenants',
      'Assistance inscription',
      'Aide au planning',
      'Reponses certification',
      'Support administratif de base',
    ],
    requiredPlan: Plan.FREE,
    targetIndustries: [Industry.EDUCATION],
    targetUseCases: ['onboarding-apprenants', 'faq-cursus', 'inscriptions'],
    estimatedSetupTime: '5 min',
    tools: ['knowledge_search', 'enroll_student', 'send_email'],
    requiredSources: ['catalogue-formations', 'faq-inscription', 'politique-certification'],
    defaultModules: [
      { type: 'rag', enabled: true },
      { type: 'progress_tracking', enabled: true },
      { type: 'escalation', enabled: true },
    ],
  },
];

function parseEstimatedSetupMinutes(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 5 : parsed;
}

function buildFeatureFlagName(flagKey: string): string {
  return flagKey
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function seedTemplates(): Promise<void> {
  console.log(`\n[seed-templates] Creation de ${TEMPLATE_SEEDS.length} templates...`);

  const defaultCompanySizes: CompanySize[] = [];

  for (const [index, template] of TEMPLATE_SEEDS.entries()) {
    console.log(`[seed-templates] (${index + 1}/${TEMPLATE_SEEDS.length}) ${template.name}`);

    await prisma.agentTemplate.upsert({
      where: { slug: template.slug },
      update: {
        name: template.name,
        description: template.description,
        category: template.category,
        icon: template.icon,
        color: template.color,
        systemPrompt: template.systemPrompt,
        capabilities: template.capabilities,
        requiredPlan: template.requiredPlan,
        targetIndustries: template.targetIndustries,
        targetUseCases: template.targetUseCases,
        tools: template.tools,
        requiredSources: template.requiredSources,
        defaultModules: template.defaultModules,
        suggestedQuestions: template.faq,
        targetCompanySizes: defaultCompanySizes,
        setupSteps: [
          {
            step: 1,
            title: 'Importer vos ressources',
            description: `Ajoutez FAQ, policies et docs metier pour ${template.name}.`,
          },
          {
            step: 2,
            title: 'Verifier ton et scenarios',
            description: `Validez le ton ${template.tone} et les cas d'usage principaux.`,
          },
          {
            step: 3,
            title: 'Publier',
            description: 'Lancez le template sur votre canal principal.',
          },
        ],
        estimatedSetupTime: parseEstimatedSetupMinutes(template.estimatedSetupTime),
        isPublic: true,
        isActive: true,
      },
      create: {
        name: template.name,
        slug: template.slug,
        description: template.description,
        category: template.category,
        icon: template.icon,
        color: template.color,
        systemPrompt: template.systemPrompt,
        capabilities: template.capabilities,
        requiredPlan: template.requiredPlan,
        targetIndustries: template.targetIndustries,
        targetUseCases: template.targetUseCases,
        tools: template.tools,
        requiredSources: template.requiredSources,
        defaultModules: template.defaultModules,
        suggestedQuestions: template.faq,
        targetCompanySizes: defaultCompanySizes,
        setupSteps: [
          {
            step: 1,
            title: 'Importer vos ressources',
            description: `Ajoutez FAQ, policies et docs metier pour ${template.name}.`,
          },
          {
            step: 2,
            title: 'Verifier ton et scenarios',
            description: `Validez le ton ${template.tone} et les cas d'usage principaux.`,
          },
          {
            step: 3,
            title: 'Publier',
            description: 'Lancez le template sur votre canal principal.',
          },
        ],
        estimatedSetupTime: parseEstimatedSetupMinutes(template.estimatedSetupTime),
        isPublic: true,
        isActive: true,
      },
    });
  }

  console.log('[seed-templates] Templates crees avec succes.');
}

async function seedDefaultFeatureFlags(): Promise<void> {
  console.log(
    `\n[seed-templates] Creation de ${DEFAULT_FEATURE_FLAGS.length} feature flags par defaut...`,
  );

  for (const [index, flag] of DEFAULT_FEATURE_FLAGS.entries()) {
    console.log(`[seed-templates] (${index + 1}/${DEFAULT_FEATURE_FLAGS.length}) ${flag.key}`);

    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {
        name: buildFeatureFlagName(flag.key),
        description: flag.description,
        enabled: flag.enabled,
        rolloutPercentage: flag.rolloutPercentage,
      },
      create: {
        key: flag.key,
        name: buildFeatureFlagName(flag.key),
        description: flag.description,
        enabled: flag.enabled,
        rolloutPercentage: flag.rolloutPercentage,
      },
    });
  }

  console.log('[seed-templates] Feature flags crees avec succes.');
}

async function main(): Promise<void> {
  console.log('Seed pre-launch infrastructure (templates + feature flags)');

  await seedTemplates();
  await seedDefaultFeatureFlags();

  console.log('\nSeed pre-launch termine.');
}

main()
  .catch((error) => {
    console.error('Seed pre-launch en erreur:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
