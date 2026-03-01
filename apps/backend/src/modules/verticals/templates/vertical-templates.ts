export interface VerticalTemplateSeed {
  slug: string;
  name: string;
  description: string;
  icon: string;
  onboardingQuestions: Array<{ key: string; label: string; type: 'text' | 'select' | 'number'; options?: string[] }>;
  defaultKnowledgeTemplates: Array<{ question: string; answer: string; category: string }>;
  defaultWorkflows: Array<{ name: string; triggerType: string; steps: Array<{ type: string; config?: Record<string, unknown> }> }>;
  kpiDefinitions: Array<{ key: string; label: string; unit: 'count' | 'percent' | 'currency' | 'time' }>;
  intentCategories: string[];
  industryVocabulary: string[];
  commonObjections: string[];
  qualificationCriteria: Array<{ key: string; label: string; weight: number }>;
  requiredIntegrations: string[];
  defaultTone: string;
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
    defaultKnowledgeTemplates: [
      { category: 'shipping', question: 'Quels sont les delais de livraison ?', answer: 'Nos delais standards sont de 2 a 5 jours ouvres.' },
      { category: 'returns', question: 'Comment retourner un produit ?', answer: 'Vous pouvez initier un retour sous 30 jours depuis votre espace client.' },
      { category: 'payment', question: 'Quels moyens de paiement acceptez-vous ?', answer: 'Nous acceptons CB, PayPal et virement selon le pays.' },
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
    industryVocabulary: ['panier', 'SKU', 'expedition', 'retour', 'remboursement'],
    commonObjections: ['Le prix est trop eleve', 'Je n ai pas confiance dans la livraison', 'Je ne trouve pas ma taille'],
    qualificationCriteria: [
      { key: 'purchase_intent', label: 'Intention d achat', weight: 40 },
      { key: 'budget_fit', label: 'Adequation budget', weight: 30 },
      { key: 'urgency', label: 'Urgence du besoin', weight: 30 },
    ],
    requiredIntegrations: ['shopify', 'stripe', 'ga4'],
    defaultTone: 'friendly',
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
    defaultKnowledgeTemplates: [
      { category: 'visits', question: 'Comment organiser une visite ?', answer: 'Nous validons vos criteres puis proposons des creneaux de visite.' },
      { category: 'financing', question: 'Travaillez-vous avec des courtiers ?', answer: 'Oui, nous pouvons vous orienter vers des partenaires financiers.' },
      { category: 'documents', question: 'Quels documents fournir ?', answer: 'Piece d identite, justificatif de revenus et projet immobilier.' },
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
    industryVocabulary: ['mandat', 'apport', 'visite', 'surface', 'compromis'],
    commonObjections: ['Les frais sont trop eleves', 'Je ne suis pas decide', 'Je veux comparer plus longtemps'],
    qualificationCriteria: [
      { key: 'budget', label: 'Budget confirme', weight: 35 },
      { key: 'timeline', label: 'Echeance projet', weight: 35 },
      { key: 'readiness', label: 'Maturite du projet', weight: 30 },
    ],
    requiredIntegrations: ['calendly', 'hubspot'],
    defaultTone: 'professional',
  },
  {
    slug: 'medical',
    name: 'Medical',
    description: 'Template pour prise de rendez-vous, orientation et pre-qualification patient.',
    icon: 'stethoscope',
    onboardingQuestions: [
      { key: 'specialities', label: 'Specialites couvertes', type: 'text' },
      { key: 'opening_hours', label: 'Horaires du cabinet', type: 'text' },
      { key: 'emergency_policy', label: 'Politique urgence', type: 'text' },
    ],
    defaultKnowledgeTemplates: [{ category: 'appointments', question: 'Comment prendre rendez-vous ?', answer: 'Nous proposons les creneaux disponibles selon votre besoin.' }],
    defaultWorkflows: [{ name: 'Prise de RDV', triggerType: 'MESSAGE_RECEIVED', steps: [{ type: 'intent_match', config: { intent: 'book_appointment' } }] }],
    kpiDefinitions: [{ key: 'appointments_booked', label: 'RDV pris', unit: 'count' }],
    intentCategories: ['book_appointment', 'symptom_question', 'opening_hours'],
    industryVocabulary: ['consultation', 'ordonnance', 'triage', 'urgence'],
    commonObjections: ['Je ne trouve pas de creneau', 'Le delai est trop long'],
    qualificationCriteria: [{ key: 'urgency_level', label: 'Niveau urgence', weight: 100 }],
    requiredIntegrations: ['doctolib', 'google-calendar'],
    defaultTone: 'empathetic',
  },
  {
    slug: 'accounting',
    name: 'Comptabilite',
    description: 'Template pour qualification dossiers et support cabinet comptable.',
    icon: 'calculator',
    onboardingQuestions: [
      { key: 'client_types', label: 'Types de clients', type: 'text' },
      { key: 'fiscal_deadlines', label: 'Echeances fiscales', type: 'text' },
      { key: 'erp_tools', label: 'Outils ERP utilises', type: 'text' },
    ],
    defaultKnowledgeTemplates: [{ category: 'tax', question: 'Quand declarer la TVA ?', answer: 'La periodicite depend de votre regime fiscal.' }],
    defaultWorkflows: [{ name: 'Qualification dossier', triggerType: 'MESSAGE_RECEIVED', steps: [{ type: 'intent_match', config: { intent: 'accounting_qualification' } }] }],
    kpiDefinitions: [{ key: 'qualified_cases', label: 'Dossiers qualifies', unit: 'count' }],
    intentCategories: ['accounting_qualification', 'tax_deadline', 'document_request'],
    industryVocabulary: ['bilan', 'TVA', 'liasse', 'fiscalite'],
    commonObjections: ['Je ne comprends pas les obligations', 'Je veux payer moins cher'],
    qualificationCriteria: [{ key: 'business_size', label: 'Taille entreprise', weight: 50 }, { key: 'urgency', label: 'Urgence dossier', weight: 50 }],
    requiredIntegrations: ['sage', 'quickbooks'],
    defaultTone: 'formal',
  },
  {
    slug: 'recruitment',
    name: 'Recrutement',
    description: 'Template pour qualification candidats et gestion pipeline hiring.',
    icon: 'users',
    onboardingQuestions: [
      { key: 'roles', label: 'Postes ouverts', type: 'text' },
      { key: 'locations', label: 'Localisations', type: 'text' },
      { key: 'salary_range', label: 'Fourchette salariale', type: 'text' },
    ],
    defaultKnowledgeTemplates: [{ category: 'process', question: 'Comment se deroule le process ?', answer: 'Pre-screening, entretien manager puis entretien final.' }],
    defaultWorkflows: [{ name: 'Pre-qualification candidat', triggerType: 'MESSAGE_RECEIVED', steps: [{ type: 'intent_match', config: { intent: 'candidate_screening' } }] }],
    kpiDefinitions: [{ key: 'qualified_candidates', label: 'Candidats qualifies', unit: 'count' }],
    intentCategories: ['candidate_screening', 'job_details', 'application_status'],
    industryVocabulary: ['entretien', 'hard skills', 'soft skills', 'hiring manager'],
    commonObjections: ['Le salaire est insuffisant', 'Le process est trop long'],
    qualificationCriteria: [{ key: 'skills_fit', label: 'Adequation competences', weight: 60 }, { key: 'availability', label: 'Disponibilite', weight: 40 }],
    requiredIntegrations: ['greenhouse', 'lever'],
    defaultTone: 'professional',
  },
  {
    slug: 'restaurant',
    name: 'Restaurant',
    description: 'Template pour reservations, commandes et relation client restauration.',
    icon: 'utensils',
    onboardingQuestions: [
      { key: 'service_types', label: 'Services proposes', type: 'text' },
      { key: 'opening_hours', label: 'Horaires ouverture', type: 'text' },
      { key: 'menu_highlights', label: 'Specialites', type: 'text' },
    ],
    defaultKnowledgeTemplates: [{ category: 'booking', question: 'Comment reserver ?', answer: 'Donnez date, heure et nombre de couverts pour valider la reservation.' }],
    defaultWorkflows: [{ name: 'Reservation table', triggerType: 'MESSAGE_RECEIVED', steps: [{ type: 'intent_match', config: { intent: 'book_table' } }] }],
    kpiDefinitions: [{ key: 'bookings', label: 'Reservations', unit: 'count' }],
    intentCategories: ['book_table', 'menu_question', 'delivery_status'],
    industryVocabulary: ['couverts', 'service', 'allergenes', 'menu'],
    commonObjections: ['Il n y a pas de place', 'Je veux annuler ma reservation'],
    qualificationCriteria: [{ key: 'party_size', label: 'Taille groupe', weight: 50 }, { key: 'visit_time', label: 'Horaire', weight: 50 }],
    requiredIntegrations: ['thefork', 'ubereats'],
    defaultTone: 'friendly',
  },
  {
    slug: 'education',
    name: 'Education',
    description: 'Template pour admissions, orientation et support apprenants.',
    icon: 'graduation-cap',
    onboardingQuestions: [
      { key: 'programs', label: 'Programmes proposes', type: 'text' },
      { key: 'admission_periods', label: 'Periodes d admission', type: 'text' },
      { key: 'tuition', label: 'Frais de scolarite', type: 'text' },
    ],
    defaultKnowledgeTemplates: [{ category: 'admissions', question: 'Comment candidater ?', answer: 'Completez le dossier en ligne puis planifiez un entretien.' }],
    defaultWorkflows: [{ name: 'Qualification admission', triggerType: 'MESSAGE_RECEIVED', steps: [{ type: 'intent_match', config: { intent: 'admission_qualification' } }] }],
    kpiDefinitions: [{ key: 'qualified_applicants', label: 'Candidats qualifies', unit: 'count' }],
    intentCategories: ['admission_qualification', 'tuition_question', 'program_info'],
    industryVocabulary: ['admission', 'credits', 'programme', 'campus'],
    commonObjections: ['Les frais sont eleves', 'Je ne sais pas quel programme choisir'],
    qualificationCriteria: [{ key: 'program_fit', label: 'Adequation programme', weight: 70 }, { key: 'timeline', label: 'Timeline admission', weight: 30 }],
    requiredIntegrations: ['hubspot', 'calendly'],
    defaultTone: 'professional',
  },
];
