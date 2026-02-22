import { Injectable, Logger } from '@nestjs/common';
import { NovaTicketsService } from './nova-tickets.service';
import { LLMToolDefinition } from '../../llm/providers/base-llm.provider';

export interface EscalationDecision {
  shouldEscalate: boolean;
  reason: string;
  priority: string;
  suggestedCategory: string;
}

const IMMEDIATE_ESCALATION_TRIGGERS = [
  /\b(avocat|lawyer|attorney|legal|juridique)\b/i,
  /\b(plainte|complaint|réclamation|litige|dispute)\b/i,
  /\b(remboursement|refund)\b.*\b(exig|demand|immédiat|urgent)\b/i,
  /\b(danger|dangereux|unsafe|blessé|injured|allergique)\b/i,
  /\b(très\s+)?mécontent|furieux|scandaleux|inacceptable\b/i,
  /\b(arnaque|scam|fraud|fraude|escroquerie)\b/i,
];

const FRUSTRATION_INDICATORS = [
  /[!]{2,}/,
  /[A-Z]{10,}/,
  /\b(encore|again|toujours|always|jamais|never)\b.*\b(résolu|fixed|répondu|answered)\b/i,
  /\b(attends?|waiting)\b.*\b(depuis|for)\b.*\b(\d+\s*(jours?|days?|semaines?|weeks?))\b/i,
];

@Injectable()
export class NovaEscalationService {
  private readonly logger = new Logger(NovaEscalationService.name);

  constructor(private readonly ticketsService: NovaTicketsService) {}

  getSupportTools(): LLMToolDefinition[] {
    return [
      {
        type: 'function',
        function: {
          name: 'create_ticket',
          description: 'Crée un ticket de support pour un problème qui nécessite un suivi',
          parameters: {
            type: 'object',
            properties: {
              subject: { type: 'string', description: 'Sujet du ticket' },
              description: { type: 'string', description: 'Description détaillée du problème' },
              priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'] },
              category: { type: 'string', enum: ['GENERAL', 'BILLING', 'TECHNICAL', 'PRODUCT', 'SHIPPING', 'RETURNS', 'ACCOUNT'] },
            },
            required: ['subject', 'description'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'lookup_order',
          description: 'Recherche les détails d\'une commande par son numéro ou email client',
          parameters: {
            type: 'object',
            properties: {
              orderId: { type: 'string', description: 'Numéro de commande' },
              email: { type: 'string', description: 'Email du client' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'search_knowledge_base',
          description: 'Recherche dans la base de connaissances pour trouver des réponses aux questions fréquentes',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Question ou mots-clés de recherche' },
              category: { type: 'string', description: 'Catégorie optionnelle pour filtrer' },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'escalate_to_human',
          description: 'Transfère la conversation à un agent humain avec contexte',
          parameters: {
            type: 'object',
            properties: {
              reason: { type: 'string', description: 'Raison de l\'escalade' },
              priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
              summary: { type: 'string', description: 'Résumé de la conversation pour l\'agent humain' },
            },
            required: ['reason', 'summary'],
          },
        },
      },
    ];
  }

  analyzeEscalation(messages: Array<{ role: string; content: string }>): EscalationDecision {
    const userMessages = messages.filter((m) => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
    const allUserContent = userMessages.map((m) => m.content).join(' ');

    // Check immediate escalation triggers
    for (const trigger of IMMEDIATE_ESCALATION_TRIGGERS) {
      if (trigger.test(lastUserMessage)) {
        return {
          shouldEscalate: true,
          reason: 'Trigger immédiat détecté (sujet sensible)',
          priority: 'URGENT',
          suggestedCategory: this.detectCategory(lastUserMessage),
        };
      }
    }

    // Check frustration level
    let frustrationScore = 0;
    for (const indicator of FRUSTRATION_INDICATORS) {
      if (indicator.test(lastUserMessage)) frustrationScore += 2;
      if (indicator.test(allUserContent)) frustrationScore += 1;
    }

    // Check if conversation is going in circles (repeated similar messages)
    if (userMessages.length >= 4) {
      const repeatedTopics = this.detectRepeatedTopics(userMessages);
      if (repeatedTopics) frustrationScore += 3;
    }

    if (frustrationScore >= 4) {
      return {
        shouldEscalate: true,
        reason: 'Niveau de frustration élevé détecté',
        priority: 'HIGH',
        suggestedCategory: this.detectCategory(lastUserMessage),
      };
    }

    return {
      shouldEscalate: false,
      reason: '',
      priority: 'MEDIUM',
      suggestedCategory: this.detectCategory(lastUserMessage),
    };
  }

  private detectCategory(message: string): string {
    if (/facturation|billing|paiement|payment|prix|price|abonnement/i.test(message)) return 'BILLING';
    if (/bug|erreur|error|crash|ne\s+fonctionne\s+pas|broken/i.test(message)) return 'TECHNICAL';
    if (/produit|product|article|taille|size|couleur|color/i.test(message)) return 'PRODUCT';
    if (/livraison|shipping|delivery|colis|package|suivi|tracking/i.test(message)) return 'SHIPPING';
    if (/retour|return|échange|exchange|remboursement|refund/i.test(message)) return 'RETURNS';
    if (/compte|account|connexion|login|mot\s+de\s+passe|password/i.test(message)) return 'ACCOUNT';
    return 'GENERAL';
  }

  private detectRepeatedTopics(messages: Array<{ role: string; content: string }>): boolean {
    const userContents = messages.filter((m) => m.role === 'user').map((m) => m.content.toLowerCase());
    if (userContents.length < 3) return false;

    // Simple check: if 3+ messages share significant words
    const lastThree = userContents.slice(-3);
    const wordSets = lastThree.map(
      (c) => new Set(c.split(/\s+/).filter((w) => w.length > 4)),
    );

    let commonCount = 0;
    for (const word of wordSets[0]) {
      if (wordSets[1].has(word) && wordSets[2].has(word)) commonCount++;
    }

    return commonCount >= 3;
  }
}
