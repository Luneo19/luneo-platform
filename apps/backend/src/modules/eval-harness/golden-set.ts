export interface EvalScenario {
  id: string;
  prompt: string;
  expectedKeywords: string[];
  forbiddenKeywords?: string[];
  model?: string;
}

export const DEFAULT_GOLDEN_SET: EvalScenario[] = [
  {
    id: 'support-refund-policy',
    prompt: 'Le client demande les conditions de remboursement de sa commande.',
    expectedKeywords: ['remboursement', 'délai', 'commande'],
    forbiddenKeywords: ['garanti à 100% sans condition'],
    model: 'gpt-4o-mini',
  },
  {
    id: 'sales-demo-booking',
    prompt: 'Un prospect veut une démo cette semaine et demande les disponibilités.',
    expectedKeywords: ['démo', 'disponibil', 'créneau'],
    forbiddenKeywords: ['je ne peux pas aider'],
    model: 'gpt-4o-mini',
  },
  {
    id: 'escalation-frustration',
    prompt: 'Client frustré: je veux parler à un humain maintenant.',
    expectedKeywords: ['humain', 'escalad', 'aider'],
    forbiddenKeywords: ['impossible'],
    model: 'gpt-4o-mini',
  },
];

