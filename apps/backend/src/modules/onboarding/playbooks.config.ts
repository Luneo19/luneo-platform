export interface VerticalPlaybook {
  industry: string;
  name: string;
  valueProposition: string;
  setupChecklist: string[];
  defaultPrompt: string;
  suggestedActions: string[];
  kpis: string[];
  timeToValueMinutes: number;
}

export const MID_MARKET_PLAYBOOKS: VerticalPlaybook[] = [
  {
    industry: 'SAAS',
    name: 'Playbook SaaS - Qualification & Demo',
    valueProposition:
      'Qualifier les leads entrants et augmenter le taux de booking de démos en moins de 5 minutes de setup.',
    setupChecklist: [
      'Connecter le site marketing',
      'Activer qualification lead (taille équipe, use case, budget)',
      'Brancher Google Calendar pour prise de RDV',
      'Configurer handoff vers sales',
      'Publier le widget',
    ],
    defaultPrompt:
      "Tu es un SDR virtuel. Tu qualifies les prospects, réponds aux objections pricing et proposes un créneau de démo pertinent.",
    suggestedActions: ['book_appointment', 'create_contact', 'create_deal'],
    kpis: ['Demo booking rate', 'MQL->SQL conversion', 'Revenue attributed'],
    timeToValueMinutes: 5,
  },
  {
    industry: 'ECOMMERCE',
    name: 'Playbook E-commerce - Conversion & Support',
    valueProposition:
      'Réduire l’abandon panier et traiter les questions avant achat avec un assistant orienté conversion.',
    setupChecklist: [
      'Importer FAQ livraison/retours',
      'Configurer actions remboursement et statut commande',
      'Activer capture email avant sortie',
      'Connecter canal widget + WhatsApp',
      'Lancer le scénario anti-abandon',
    ],
    defaultPrompt:
      "Tu aides les visiteurs à acheter plus vite: produits, livraison, retours, paiement. Tu privilégies des réponses concrètes et rassurantes.",
    suggestedActions: ['check_order_status', 'process_refund', 'add_to_cart'],
    kpis: ['Cart recovery rate', 'AOV uplift', 'Resolution without human'],
    timeToValueMinutes: 5,
  },
  {
    industry: 'CONSULTING',
    name: 'Playbook Services - Qualification & Prise de RDV',
    valueProposition:
      'Qualifier les demandes entrantes et transformer les visiteurs en rendez-vous qualifiés.',
    setupChecklist: [
      'Configurer secteurs servis et tickets minimum',
      'Activer qualification projet (deadline, budget, scope)',
      'Connecter agenda équipe',
      'Activer export CRM',
      'Déployer widget avec script',
    ],
    defaultPrompt:
      "Tu es un assistant de pré-qualification. Tu identifies les besoins, filtres les demandes non-prioritaires et proposes un rendez-vous.",
    suggestedActions: ['book_appointment', 'create_contact', 'send_email'],
    kpis: ['Qualified lead rate', 'Meeting show-up rate', 'Pipeline value'],
    timeToValueMinutes: 5,
  },
];

