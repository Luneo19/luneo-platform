/**
 * @fileoverview Agent Aria - Assistant Personnalisation pour clients finaux (B2C)
 * @module AriaService
 *
 * CAPACITÉS:
 * - Suggestions de personnalisation créatives
 * - Amélioration de textes/messages
 * - Recommandation de styles/polices
 * - Génération d'idées cadeaux
 * - Traduction multilingue
 * - Vérification orthographique
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Validation Zod
 * - ✅ Gestion d'erreurs
 */

import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { LLMRouterService, LLMProvider, LLM_MODELS, Message } from '../services/llm-router.service';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export enum AriaIntentType {
  SUGGEST_TEXT = 'suggest_text',
  IMPROVE_TEXT = 'improve_text',
  SUGGEST_STYLE = 'suggest_style',
  GIFT_IDEAS = 'gift_ideas',
  TRANSLATE = 'translate',
  SPELL_CHECK = 'spell_check',
  GENERAL_HELP = 'general_help',
}

const AriaMessageSchema = z.object({
  sessionId: z.string().uuid(),
  productId: z.string().uuid(),
  brandId: z.string().uuid().optional(), // Optionnel, sera récupéré depuis product si absent
  message: z.string().min(1).max(1000),
  context: z.object({
    occasion: z.string().optional(),
    recipient: z.string().optional(),
    currentText: z.string().optional(),
    currentStyle: z.object({
      font: z.string().optional(),
      color: z.string().optional(),
    }).optional(),
    language: z.string().default('fr'),
  }).optional(),
});

export type AriaMessage = z.infer<typeof AriaMessageSchema>;

export interface AriaResponse {
  message: string;
  intent: AriaIntentType;
  suggestions: AriaSuggestion[];
  preview?: {
    text: string;
    font: string;
    color: string;
  };
}

export interface AriaSuggestion {
  type: 'text' | 'style' | 'action';
  value: string;
  label: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// PROMPTS
// ============================================================================

const ARIA_SYSTEM_PROMPT = `Tu es Aria, l'assistante de personnalisation de Luneo.

PERSONNALITÉ:
- Créative et inspirante
- Chaleureuse et empathique
- Concise et efficace
- Enthousiaste mais professionnelle

CAPACITÉS:
1. Suggérer des textes pour différentes occasions (anniversaire, mariage, naissance, etc.)
2. Améliorer et embellir les textes des utilisateurs
3. Recommander des styles (polices, couleurs) adaptés
4. Générer des idées de cadeaux personnalisés
5. Traduire des messages dans différentes langues
6. Corriger l'orthographe et la grammaire

RÈGLES:
- Proposer toujours 3-4 suggestions variées
- Utiliser des emojis avec parcimonie (✨ 💝 🎁 🌟)
- Garder les suggestions courtes (max 50 caractères pour gravure)
- Adapter le ton à l'occasion
- Toujours proposer des variations (classique, moderne, poétique)

CONTEXTE PRODUIT:
{productContext}

CONTEXTE UTILISATEUR:
{userContext}`;

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class AriaService {
  private readonly logger = new Logger(AriaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly llmRouter: LLMRouterService,
  ) {}

  /**
   * Traite un message utilisateur
   */
  async chat(input: AriaMessage): Promise<AriaResponse> {
    const validated = AriaMessageSchema.parse(input);

    try {
      const intent = this.detectIntent(validated.message, validated.context);
      const productContext = await this.getProductContext(validated.productId);
      
      // Récupérer brandId depuis le produit si non fourni
      let brandId = validated.brandId;
      if (!brandId && productContext.brandId) {
        brandId = productContext.brandId as string;
      }

      const systemPrompt = ARIA_SYSTEM_PROMPT
        .replace('{productContext}', JSON.stringify(productContext, null, 2))
        .replace('{userContext}', JSON.stringify(validated.context || {}, null, 2));

      const messages: Message[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: this.buildUserPrompt(validated, intent) },
      ];

      const llmResponse = await this.llmRouter.chat({
        provider: LLMProvider.OPENAI,
        model: LLM_MODELS.openai.GPT35_TURBO,
        messages,
        temperature: 0.8,
        maxTokens: 1024,
        brandId: brandId,
        agentType: 'aria',
        enableFallback: true,
      });

      const { message, suggestions, preview } = this.parseResponse(
        llmResponse.content,
        intent,
        validated.context,
      );

      return {
        message,
        intent,
        suggestions,
        preview,
      };
    } catch (error) {
      this.logger.error(`Aria chat error: ${error}`);
      throw error;
    }
  }

  /**
   * Génère des suggestions rapides sans conversation
   */
  async quickSuggest(
    productId: string,
    occasion: string,
    language: string = 'fr',
    brandId?: string,
  ): Promise<AriaSuggestion[]> {
    const cacheKey = `aria:quick:${productId}:${occasion}:${language}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const productContext = await this.getProductContext(productId);
        const finalBrandId = brandId || (productContext.brandId as string | undefined);

        const prompt = `Génère 6 suggestions de textes courts pour ${occasion} en ${language}.
Format: JSON array avec { "text": "...", "style": "classique|moderne|poétique" }
Produit: ${productContext.name}
Max caractères: ${productContext.maxChars || 50}`;

        const response = await this.llmRouter.chat({
          provider: LLMProvider.OPENAI,
          model: LLM_MODELS.openai.GPT35_TURBO,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9,
          maxTokens: 512,
          brandId: finalBrandId,
          agentType: 'aria',
          enableFallback: true,
        });

        try {
          const parsed = JSON.parse(response.content);
          return parsed.map((item: { text: string; style: string }) => ({
            type: 'text' as const,
            value: item.text,
            label: item.style,
          }));
        } catch {
          return [];
        }
      },
      3600 // Cache 1 heure
    );
  }

  /**
   * Améliore un texte existant
   */
  async improveText(
    text: string,
    style: 'elegant' | 'fun' | 'romantic' | 'formal',
    language: string = 'fr',
    brandId?: string,
  ): Promise<{ original: string; improved: string; variations: string[] }> {
    const prompt = `Améliore ce texte en style ${style} (${language}):
"${text}"

Réponds en JSON:
{
  "improved": "version améliorée principale",
  "variations": ["variation 1", "variation 2", "variation 3"]
}`;

    const response = await this.llmRouter.chat({
      provider: LLMProvider.OPENAI,
      model: LLM_MODELS.openai.GPT35_TURBO,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 512,
      brandId: brandId,
      agentType: 'aria',
      enableFallback: true,
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        original: text,
        improved: parsed.improved,
        variations: parsed.variations,
      };
    } catch {
      return {
        original: text,
        improved: text,
        variations: [],
      };
    }
  }

  /**
   * Recommande un style (police + couleur) pour un texte
   */
  async recommendStyle(
    text: string,
    occasion: string,
    productType: string = 'bijou',
    brandId?: string,
  ): Promise<Array<{ font: string; color: string; reason: string }>> {
    const prompt = `Recommande 3 styles (police + couleur) pour ce texte: "${text}"
Occasion: ${occasion}
Type de produit: ${productType}

Réponds en JSON:
{
  "styles": [
    { "font": "nom police", "color": "#hex", "reason": "explication" }
  ]
}`;

    const response = await this.llmRouter.chat({
      provider: LLMProvider.OPENAI,
      model: LLM_MODELS.openai.GPT35_TURBO,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 512,
      brandId: brandId,
      agentType: 'aria',
      enableFallback: true,
    });

    try {
      const parsed = JSON.parse(response.content);
      return parsed.styles || [];
    } catch {
      return [
        { font: 'Playfair Display', color: '#333333', reason: 'Classique et élégant' },
        { font: 'Montserrat', color: '#000000', reason: 'Moderne et épuré' },
        { font: 'Dancing Script', color: '#8B4513', reason: 'Romantique et chaleureux' },
      ];
    }
  }

  /**
   * Traduit un texte dans une langue cible
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'fr',
    brandId?: string,
  ): Promise<{ original: string; translated: string; sourceLanguage: string; targetLanguage: string }> {
    const prompt = `Traduis ce texte du ${sourceLanguage} vers le ${targetLanguage}:
"${text}"

Réponds en JSON:
{
  "translated": "texte traduit",
  "sourceLanguage": "${sourceLanguage}",
  "targetLanguage": "${targetLanguage}"
}`;

    const response = await this.llmRouter.chat({
      provider: LLMProvider.OPENAI,
      model: LLM_MODELS.openai.GPT35_TURBO,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      maxTokens: 256,
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        original: text,
        translated: parsed.translated || text,
        sourceLanguage: parsed.sourceLanguage || sourceLanguage,
        targetLanguage: parsed.targetLanguage || targetLanguage,
      };
    } catch {
      return {
        original: text,
        translated: text,
        sourceLanguage,
        targetLanguage,
      };
    }
  }

  /**
   * Vérifie l'orthographe et la grammaire
   */
  async spellCheck(
    text: string,
    language: string = 'fr',
    brandId?: string,
  ): Promise<{
    original: string;
    corrected: string;
    errors: Array<{ word: string; suggestion: string; position: number }>;
  }> {
    const prompt = `Corrige l'orthographe et la grammaire de ce texte en ${language}:
"${text}"

Réponds en JSON:
{
  "corrected": "texte corrigé",
  "errors": [
    { "word": "mot incorrect", "suggestion": "correction", "position": 0 }
  ]
}`;

    const response = await this.llmRouter.chat({
      provider: LLMProvider.OPENAI,
      model: LLM_MODELS.openai.GPT35_TURBO,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      maxTokens: 512,
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        original: text,
        corrected: parsed.corrected || text,
        errors: parsed.errors || [],
      };
    } catch {
      return {
        original: text,
        corrected: text,
        errors: [],
      };
    }
  }

  /**
   * Génère des idées de cadeaux personnalisés
   */
  async giftIdeas(
    occasion: string,
    recipient: string,
    budget?: string,
    preferences?: string,
    brandId?: string,
  ): Promise<Array<{ idea: string; product: string; personalization: string; reason: string }>> {
    const prompt = `Génère 5 idées de cadeaux personnalisés pour:
Occasion: ${occasion}
Destinataire: ${recipient}
${budget ? `Budget: ${budget}` : ''}
${preferences ? `Préférences: ${preferences}` : ''}

Réponds en JSON:
{
  "ideas": [
    {
      "idea": "idée cadeau",
      "product": "type de produit",
      "personalization": "suggestion personnalisation",
      "reason": "pourquoi cette idée"
    }
  ]
}`;

    const response = await this.llmRouter.chat({
      provider: LLMProvider.OPENAI,
      model: LLM_MODELS.openai.GPT35_TURBO,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      maxTokens: 1024,
    });

    try {
      const parsed = JSON.parse(response.content);
      return parsed.ideas || [];
    } catch {
      return [
        {
          idea: 'Bracelet gravé avec prénom',
          product: 'Bracelet',
          personalization: 'Gravure du prénom du destinataire',
          reason: 'Personnel et intemporel',
        },
      ];
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private detectIntent(message: string, context?: AriaMessage['context']): AriaIntentType {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('tradui') || lowerMessage.includes('translate')) {
      return AriaIntentType.TRANSLATE;
    }
    if (lowerMessage.includes('corrige') || lowerMessage.includes('orthographe')) {
      return AriaIntentType.SPELL_CHECK;
    }
    if (lowerMessage.includes('améliore') || lowerMessage.includes('embelli')) {
      return AriaIntentType.IMPROVE_TEXT;
    }
    if (lowerMessage.includes('police') || lowerMessage.includes('couleur') || lowerMessage.includes('style')) {
      return AriaIntentType.SUGGEST_STYLE;
    }
    if (lowerMessage.includes('idée') || lowerMessage.includes('cadeau')) {
      return AriaIntentType.GIFT_IDEAS;
    }
    if (lowerMessage.includes('suggère') || lowerMessage.includes('propose') || context?.occasion) {
      return AriaIntentType.SUGGEST_TEXT;
    }

    return AriaIntentType.GENERAL_HELP;
  }

  private buildUserPrompt(input: AriaMessage, intent: AriaIntentType): string {
    const { message, context } = input;

    switch (intent) {
      case AriaIntentType.SUGGEST_TEXT:
        return `L'utilisateur cherche des idées de texte.
Message: "${message}"
Occasion: ${context?.occasion || 'non précisée'}
Destinataire: ${context?.recipient || 'non précisé'}

Propose 4 suggestions variées avec différents styles.`;

      case AriaIntentType.IMPROVE_TEXT:
        return `L'utilisateur veut améliorer ce texte: "${context?.currentText || message}"
Propose une version améliorée et 2-3 variations.`;

      case AriaIntentType.SUGGEST_STYLE:
        return `L'utilisateur cherche un style pour: "${context?.currentText || message}"
Propose 3 combinaisons police + couleur adaptées.`;

      default:
        return message;
    }
  }

  private async getProductContext(productId: string): Promise<Record<string, unknown>> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        brandId: true,
      },
    });

    if (!product) {
      return { name: 'Produit', maxChars: 50 };
    }

    return {
      name: product.name,
      brandId: product.brandId,
      type: 'bijou',
      maxChars: 50,
      availableFonts: [],
    };
  }

  private parseResponse(
    content: string,
    intent: AriaIntentType,
    context?: AriaMessage['context'],
  ): {
    message: string;
    suggestions: AriaSuggestion[];
    preview?: { text: string; font: string; color: string };
  } {
    const suggestions: AriaSuggestion[] = [];

    const suggestionMatches = content.match(/"([^"]+)"/g);
    if (suggestionMatches) {
      suggestionMatches.slice(0, 4).forEach((match, index) => {
        suggestions.push({
          type: 'text',
          value: match.replace(/"/g, ''),
          label: ['Classique', 'Moderne', 'Poétique', 'Original'][index] || 'Suggestion',
        });
      });
    }

    return {
      message: content,
      suggestions,
      preview: context?.currentText ? {
        text: context.currentText,
        font: context.currentStyle?.font || 'Playfair Display',
        color: context.currentStyle?.color || '#333333',
      } : undefined,
    };
  }
}
