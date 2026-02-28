export interface VerticalTemplateSeed {
  slug: string;
  name: string;
  description: string;
  icon: string;
  onboardingQuestions: Array<{ key: string; label: string; type: 'text' | 'select' | 'number'; options?: string[] }>;
  defaultWorkflows: Array<{ name: string; triggerType: string; steps: Array<{ type: string; config?: Record<string, unknown> }> }>;
  kpiDefinitions: Array<{ key: string; label: string; unit: 'count' | 'percent' | 'currency' | 'time' }>;
  intentCategories: string[];
}

export const VERTICAL_TEMPLATES: VerticalTemplateSeed[] = [
  {
    slug: 'ecommerce',
    name: 'E-commerce',
    description: 'Template optimise pour support commande, retours et conversion.',
    icon: 'shopping-bag',
    onboardingQuestions: [
      { key: 'catalog_size', label: 'Combien de produits actifs ?', type: 'number' },
      { key: 'avg_order_value', label: 'Panier moyen', type: 'number' },
      { key: 'main_channels', label: 'Canaux principaux', type: 'text' },
    ],
    defaultWorkflows: [
      {
        name: 'Suivi de commande',
        triggerType: 'MESSAGE_RECEIVED',
        steps: [{ type: 'intent_match', config: { intent: 'order_tracking' } }, { type: 'action', config: { action: 'track_order' } }],
      },
      {
        name: 'Retour produit',
        triggerType: 'MESSAGE_RECEIVED',
        steps: [{ type: 'intent_match', config: { intent: 'return_request' } }, { type: 'action', config: { action: 'initiate_return' } }],
      },
    ],
    kpiDefinitions: [
      { key: 'auto_resolution_rate', label: 'Taux resolution IA', unit: 'percent' },
      { key: 'order_tracking_success', label: 'Demandes suivi traitees', unit: 'count' },
      { key: 'roi_net', label: 'ROI net', unit: 'currency' },
    ],
    intentCategories: ['order_tracking', 'return_request', 'shipping_delay', 'product_question', 'discount_request'],
  },
  {
    slug: 'real-estate',
    name: 'Immobilier',
    description: 'Template optimise pour qualification leads et prise de rendez-vous.',
    icon: 'building',
    onboardingQuestions: [
      { key: 'property_types', label: 'Types de biens couverts', type: 'text' },
      { key: 'areas', label: 'Zones geographiques', type: 'text' },
      { key: 'avg_budget', label: 'Budget moyen des leads', type: 'number' },
    ],
    defaultWorkflows: [
      {
        name: 'Qualification lead',
        triggerType: 'MESSAGE_RECEIVED',
        steps: [{ type: 'intent_match', config: { intent: 'lead_qualification' } }, { type: 'action', config: { action: 'qualify_lead' } }],
      },
      {
        name: 'Prise de visite',
        triggerType: 'MESSAGE_RECEIVED',
        steps: [{ type: 'intent_match', config: { intent: 'visit_booking' } }, { type: 'action', config: { action: 'schedule_visit' } }],
      },
    ],
    kpiDefinitions: [
      { key: 'qualified_leads', label: 'Leads qualifies', unit: 'count' },
      { key: 'visit_booking_rate', label: 'Taux RDV', unit: 'percent' },
      { key: 'roi_net', label: 'ROI net', unit: 'currency' },
    ],
    intentCategories: ['lead_qualification', 'visit_booking', 'property_search', 'financing_question', 'document_request'],
  },
];
