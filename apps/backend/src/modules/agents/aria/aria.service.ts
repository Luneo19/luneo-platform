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
import { AgentUsageGuardService } from '../services/agent-usage-guard.service';

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

/**
 * Réponse complète d'Aria avec typage strict
 */
export interface AriaResponse {
  message: string;
  intent: AriaIntentType;
  suggestions: AriaSuggestion[];
  preview?: PersonalizationPreview;
}

// ============================================================================
// TYPES STRICTS POUR LES DONNÉES
// ============================================================================

/**
 * Suggestion Aria avec typage strict
 */
export interface AriaSuggestion {
  type: 'text' | 'style' | 'action';
  value: string;
  label: string;
  metadata?: AriaSuggestionMetadata;
}

/**
 * Métadonnées pour les suggestions (typage strict)
 */
interface AriaSuggestionMetadata {
  style?: 'classique' | 'moderne' | 'poétique' | 'original';
  occasion?: string;
  language?: string;
  confidence?: number;
}

/**
 * Contexte produit enrichi
 */
interface ProductContext {
  id: string;
  name: string;
  brandId: string;
  type: string;
  maxChars: number;
  availableFonts: string[];
}

/**
 * Réponse d'amélioration de texte
 */
export interface TextImprovementResult {
  original: string;
  improved: string;
  variations: string[];
}

/**
 * Style recommandé
 */
export interface RecommendedStyle {
  font: string;
  color: string;
  reason: string;
}

/**
 * Résultat de traduction
 */
export interface TranslationResult {
  original: string;
  translated: string;
  sourceLanguage: string;
  targetLanguage: string;
}

/**
 * Erreur orthographique détectée
 */
interface SpellCheckError {
  word: string;
  suggestion: string;
  position: number;
}

/**
 * Résultat de vérification orthographique
 */
export interface SpellCheckResult {
  original: string;
  corrected: string;
  errors: SpellCheckError[];
}

/**
 * Idée de cadeau personnalisé
 */
export interface GiftIdea {
  idea: string;
  product: string;
  personalization: string;
  reason: string;
}

/**
 * Aperçu de personnalisation
 */
interface PersonalizationPreview {
  text: string;
  font: string;
  color: string;
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
    private readonly usageGuard: AgentUsageGuardService,
  ) {}

  /**
   * Traite un message utilisateur
   */
  async chat(input: AriaMessage): Promise<AriaResponse> {
    const validated = AriaMessageSchema.parse(input);
    const startTime = Date.now();

    try {
      const intent = this.detectIntent(validated.message, validated.context);
      const productContext = await this.getProductContext(validated.productId);
      
      // Récupérer brandId depuis le produit si non fourni
      let brandId = validated.brandId;
      if (!brandId && productContext.brandId) {
        brandId = productContext.brandId as string;
      }

      // Vérifier usage (Usage Guardian)
      if (brandId) {
        const brand = await this.prisma.brand.findUnique({
          where: { id: brandId },
          select: { plan: true },
        });

        const usageCheck = await this.usageGuard.checkUsageBeforeCall(
          brandId,
          undefined,
          brand?.plan,
          1024, // Estimation tokens pour Aria
          'openai',
          'gpt-3.5-turbo',
        );

        if (!usageCheck.allowed) {
          throw new Error(usageCheck.reason || 'Usage limit exceeded');
        }
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

      const latencyMs = Date.now() - startTime;

      // Calculer le coût
      const costCalculation = this.usageGuard.getCostCalculator().calculateCost(
        'openai',
        'gpt-3.5-turbo',
        {
          inputTokens: llmResponse.usage?.promptTokens || 0,
          outputTokens: llmResponse.usage?.completionTokens || 0,
          totalTokens: llmResponse.usage?.totalTokens || 0,
        },
      );

      // Mettre à jour l'usage (Usage Guardian + AI Monitor)
      if (brandId) {
        await this.usageGuard.updateUsageAfterCall(
          brandId,
          undefined,
          undefined, // agentId sera 'aria'
          {
            tokens: {
              input: llmResponse.usage?.promptTokens || 0,
              output: llmResponse.usage?.completionTokens || 0,
            },
            costCents: costCalculation.costCents,
            latencyMs,
            success: true,
          },
          'openai',
          'gpt-3.5-turbo',
          'chat',
        );
      }

      return {
        message,
        intent,
        suggestions,
        preview,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      // Tracker l'erreur
      const productContext = await this.getProductContext(validated.productId).catch(() => null);
      const brandId = validated.brandId || (productContext?.brandId as string | undefined);

      if (brandId) {
        await this.usageGuard.updateUsageAfterCall(
          brandId,
          undefined,
          undefined,
          {
            tokens: { input: 0, output: 0 },
            costCents: 0,
            latencyMs,
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
          'openai',
          'gpt-3.5-turbo',
          'chat',
        );
      }

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

        // ✅ Parsing avec validation et gardes
        return this.parseQuickSuggestResponse(response.content);
      },
      3600 // Cache 1 heure
    );
  }

  /**
   * Améliore un texte existant avec typage strict et validation robuste
   */
  async improveText(
    text: string,
    style: 'elegant' | 'fun' | 'romantic' | 'formal',
    language: string = 'fr',
    brandId?: string,
  ): Promise<TextImprovementResult> {
    // ✅ Validation des entrées
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      this.logger.warn('Empty text provided to improveText');
      return {
        original: text || '',
        improved: text || '',
        variations: [],
      };
    }

    const prompt = `Améliore ce texte en style ${style} (${language}):
"${text}"

Réponds en JSON:
{
  "improved": "version améliorée principale",
  "variations": ["variation 1", "variation 2", "variation 3"]
}`;

    try {
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

      // ✅ Parsing avec validation et gardes
      return this.parseTextImprovementResponse(response.content, text);
    } catch (error) {
      this.logger.error(
        `Failed to improve text: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return {
        original: text,
        improved: text,
        variations: [],
      };
    }
  }

  /**
   * Parse et valide la réponse d'amélioration de texte
   */
  private parseTextImprovementResponse(
    content: string,
    originalText: string,
  ): TextImprovementResult {
    try {
      const parsed = JSON.parse(content) as Partial<{
        improved: string;
        variations: string[];
      }>;

      // ✅ Gardes pour éviter les crashes
      const improved = typeof parsed.improved === 'string' && parsed.improved.trim().length > 0
        ? parsed.improved
        : originalText;

      const variations = Array.isArray(parsed.variations)
        ? parsed.variations.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
        : [];

      return {
        original: originalText,
        improved,
        variations,
      };
    } catch (error) {
      this.logger.warn(`Failed to parse text improvement response: ${error instanceof Error ? error.message : 'Unknown'}`);
      return {
        original: originalText,
        improved: originalText,
        variations: [],
      };
    }
  }

  /**
   * Recommande un style (police + couleur) pour un texte avec typage strict
   */
  async recommendStyle(
    text: string,
    occasion: string,
    productType: string = 'bijou',
    brandId?: string,
  ): Promise<RecommendedStyle[]> {
    // ✅ Validation des entrées
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      this.logger.warn('Empty text provided to recommendStyle');
      return this.getDefaultStyles();
    }

    const prompt = `Recommande 3 styles (police + couleur) pour ce texte: "${text}"
Occasion: ${occasion}
Type de produit: ${productType}

Réponds en JSON:
{
  "styles": [
    { "font": "nom police", "color": "#hex", "reason": "explication" }
  ]
}`;

    try {
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

      // ✅ Parsing avec validation
      return this.parseStyleRecommendations(response.content);
    } catch (error) {
      this.logger.error(
        `Failed to recommend style: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return this.getDefaultStyles();
    }
  }

  /**
   * Parse et valide les recommandations de style
   */
  private parseStyleRecommendations(content: string): RecommendedStyle[] {
    try {
      const parsed = JSON.parse(content) as Partial<{
        styles: Array<Partial<RecommendedStyle>>;
      }>;

      if (!Array.isArray(parsed.styles)) {
        return this.getDefaultStyles();
      }

      // ✅ Validation et normalisation de chaque style
      const validStyles = parsed.styles
        .map((style) => this.normalizeStyle(style))
        .filter((style): style is RecommendedStyle => style !== null);

      return validStyles.length > 0 ? validStyles : this.getDefaultStyles();
    } catch (error) {
      this.logger.warn(`Failed to parse style recommendations: ${error instanceof Error ? error.message : 'Unknown'}`);
      return this.getDefaultStyles();
    }
  }

  /**
   * Normalise un style avec gardes
   */
  private normalizeStyle(style: Partial<RecommendedStyle>): RecommendedStyle | null {
    if (!style || typeof style !== 'object') {
      return null;
    }

    const font = typeof style.font === 'string' && style.font.trim().length > 0
      ? style.font.trim()
      : null;
    const color = typeof style.color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(style.color.trim())
      ? style.color.trim()
      : null;
    const reason = typeof style.reason === 'string' && style.reason.trim().length > 0
      ? style.reason.trim()
      : null;

    if (!font || !color || !reason) {
      return null;
    }

    return { font, color, reason };
  }

  /**
   * Styles par défaut en cas d'erreur
   */
  private getDefaultStyles(): RecommendedStyle[] {
    return [
      { font: 'Playfair Display', color: '#333333', reason: 'Classique et élégant' },
      { font: 'Montserrat', color: '#000000', reason: 'Moderne et épuré' },
      { font: 'Dancing Script', color: '#8B4513', reason: 'Romantique et chaleureux' },
    ];
  }

  /**
   * Traduit un texte dans une langue cible avec typage strict
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'fr',
    brandId?: string,
  ): Promise<TranslationResult> {
    // ✅ Validation des entrées
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      this.logger.warn('Empty text provided to translate');
      return {
        original: text || '',
        translated: text || '',
        sourceLanguage: sourceLanguage || 'fr',
        targetLanguage: targetLanguage || 'fr',
      };
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
      this.logger.warn('Invalid targetLanguage provided');
      return {
        original: text,
        translated: text,
        sourceLanguage: sourceLanguage || 'fr',
        targetLanguage: 'fr',
      };
    }

    const prompt = `Traduis ce texte du ${sourceLanguage} vers le ${targetLanguage}:
"${text}"

Réponds en JSON:
{
  "translated": "texte traduit",
  "sourceLanguage": "${sourceLanguage}",
  "targetLanguage": "${targetLanguage}"
}`;

    try {
      const response = await this.llmRouter.chat({
        provider: LLMProvider.OPENAI,
        model: LLM_MODELS.openai.GPT35_TURBO,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        maxTokens: 256,
        brandId: brandId,
        agentType: 'aria',
        enableFallback: true,
      });

      // ✅ Parsing avec validation
      return this.parseTranslationResponse(response.content, text, sourceLanguage, targetLanguage);
    } catch (error) {
      this.logger.error(
        `Failed to translate text: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return {
        original: text,
        translated: text,
        sourceLanguage,
        targetLanguage,
      };
    }
  }

  /**
   * Parse et valide la réponse de traduction
   */
  private parseTranslationResponse(
    content: string,
    originalText: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): TranslationResult {
    try {
      const parsed = JSON.parse(content) as Partial<{
        translated: string;
        sourceLanguage: string;
        targetLanguage: string;
      }>;

      return {
        original: originalText,
        translated: typeof parsed.translated === 'string' && parsed.translated.trim().length > 0
          ? parsed.translated.trim()
          : originalText,
        sourceLanguage: typeof parsed.sourceLanguage === 'string' && parsed.sourceLanguage.trim().length > 0
          ? parsed.sourceLanguage.trim()
          : sourceLanguage,
        targetLanguage: typeof parsed.targetLanguage === 'string' && parsed.targetLanguage.trim().length > 0
          ? parsed.targetLanguage.trim()
          : targetLanguage,
      };
    } catch (error) {
      this.logger.warn(`Failed to parse translation response: ${error instanceof Error ? error.message : 'Unknown'}`);
      return {
        original: originalText,
        translated: originalText,
        sourceLanguage,
        targetLanguage,
      };
    }
  }

  /**
   * Vérifie l'orthographe et la grammaire avec typage strict
   */
  async spellCheck(
    text: string,
    language: string = 'fr',
    brandId?: string,
  ): Promise<SpellCheckResult> {
    // ✅ Validation des entrées
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      this.logger.warn('Empty text provided to spellCheck');
      return {
        original: text || '',
        corrected: text || '',
        errors: [],
      };
    }

    const prompt = `Corrige l'orthographe et la grammaire de ce texte en ${language}:
"${text}"

Réponds en JSON:
{
  "corrected": "texte corrigé",
  "errors": [
    { "word": "mot incorrect", "suggestion": "correction", "position": 0 }
  ]
}`;

    try {
      const response = await this.llmRouter.chat({
        provider: LLMProvider.OPENAI,
        model: LLM_MODELS.openai.GPT35_TURBO,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        maxTokens: 512,
        brandId: brandId,
        agentType: 'aria',
        enableFallback: true,
      });

      // ✅ Parsing avec validation
      return this.parseSpellCheckResponse(response.content, text);
    } catch (error) {
      this.logger.error(
        `Failed to spell check text: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return {
        original: text,
        corrected: text,
        errors: [],
      };
    }
  }

  /**
   * Parse et valide la réponse de vérification orthographique
   */
  private parseSpellCheckResponse(content: string, originalText: string): SpellCheckResult {
    try {
      const parsed = JSON.parse(content) as Partial<{
        corrected: string;
        errors: Array<Partial<SpellCheckError>>;
      }>;

      const corrected = typeof parsed.corrected === 'string' && parsed.corrected.trim().length > 0
        ? parsed.corrected.trim()
        : originalText;

      const errors = Array.isArray(parsed.errors)
        ? parsed.errors
            .map((error) => this.normalizeSpellCheckError(error))
            .filter((error): error is SpellCheckError => error !== null)
        : [];

      return {
        original: originalText,
        corrected,
        errors,
      };
    } catch (error) {
      this.logger.warn(`Failed to parse spell check response: ${error instanceof Error ? error.message : 'Unknown'}`);
      return {
        original: originalText,
        corrected: originalText,
        errors: [],
      };
    }
  }

  /**
   * Normalise une erreur orthographique avec gardes
   */
  private normalizeSpellCheckError(error: Partial<SpellCheckError>): SpellCheckError | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const word = typeof error.word === 'string' && error.word.trim().length > 0
      ? error.word.trim()
      : null;
    const suggestion = typeof error.suggestion === 'string' && error.suggestion.trim().length > 0
      ? error.suggestion.trim()
      : null;
    const position = typeof error.position === 'number' && error.position >= 0
      ? error.position
      : null;

    if (!word || !suggestion || position === null) {
      return null;
    }

    return { word, suggestion, position };
  }

  /**
   * Génère des idées de cadeaux personnalisés avec typage strict
   */
  async giftIdeas(
    occasion: string,
    recipient: string,
    budget?: string,
    preferences?: string,
    brandId?: string,
  ): Promise<GiftIdea[]> {
    // ✅ Validation des entrées
    if (!occasion || typeof occasion !== 'string' || occasion.trim().length === 0) {
      this.logger.warn('Empty occasion provided to giftIdeas');
      return this.getDefaultGiftIdea();
    }

    if (!recipient || typeof recipient !== 'string' || recipient.trim().length === 0) {
      this.logger.warn('Empty recipient provided to giftIdeas');
      return this.getDefaultGiftIdea();
    }

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

    try {
      const response = await this.llmRouter.chat({
        provider: LLMProvider.OPENAI,
        model: LLM_MODELS.openai.GPT35_TURBO,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        maxTokens: 1024,
        brandId: brandId,
        agentType: 'aria',
        enableFallback: true,
      });

      // ✅ Parsing avec validation
      return this.parseGiftIdeasResponse(response.content);
    } catch (error) {
      this.logger.error(
        `Failed to generate gift ideas: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return this.getDefaultGiftIdea();
    }
  }

  /**
   * Parse et valide les idées de cadeaux
   */
  private parseGiftIdeasResponse(content: string): GiftIdea[] {
    try {
      const parsed = JSON.parse(content) as Partial<{
        ideas: Array<Partial<GiftIdea>>;
      }>;

      if (!Array.isArray(parsed.ideas)) {
        return this.getDefaultGiftIdea();
      }

      // ✅ Validation et normalisation de chaque idée
      const validIdeas = parsed.ideas
        .map((idea) => this.normalizeGiftIdea(idea))
        .filter((idea): idea is GiftIdea => idea !== null);

      return validIdeas.length > 0 ? validIdeas : this.getDefaultGiftIdea();
    } catch (error) {
      this.logger.warn(`Failed to parse gift ideas response: ${error instanceof Error ? error.message : 'Unknown'}`);
      return this.getDefaultGiftIdea();
    }
  }

  /**
   * Normalise une idée de cadeau avec gardes
   */
  private normalizeGiftIdea(idea: Partial<GiftIdea>): GiftIdea | null {
    if (!idea || typeof idea !== 'object') {
      return null;
    }

    const ideaText = typeof idea.idea === 'string' && idea.idea.trim().length > 0
      ? idea.idea.trim()
      : null;
    const product = typeof idea.product === 'string' && idea.product.trim().length > 0
      ? idea.product.trim()
      : null;
    const personalization = typeof idea.personalization === 'string' && idea.personalization.trim().length > 0
      ? idea.personalization.trim()
      : null;
    const reason = typeof idea.reason === 'string' && idea.reason.trim().length > 0
      ? idea.reason.trim()
      : null;

    if (!ideaText || !product || !personalization || !reason) {
      return null;
    }

    return { idea: ideaText, product, personalization, reason };
  }

  /**
   * Idée de cadeau par défaut en cas d'erreur
   */
  private getDefaultGiftIdea(): GiftIdea[] {
    return [
      {
        idea: 'Bracelet gravé avec prénom',
        product: 'Bracelet',
        personalization: 'Gravure du prénom du destinataire',
        reason: 'Personnel et intemporel',
      },
    ];
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

  /**
   * Récupère le contexte produit avec typage strict et gardes
   */
  private async getProductContext(productId: string): Promise<ProductContext> {
    // ✅ Validation de l'ID
    if (!productId || typeof productId !== 'string' || productId.trim().length === 0) {
      this.logger.warn('Invalid productId provided to getProductContext');
      return this.getDefaultProductContext();
    }

    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          brandId: true,
        },
      });

      // ✅ Garde pour éviter les crashes
      if (!product) {
        this.logger.warn(`Product not found: ${productId}`);
        return this.getDefaultProductContext();
      }

      return {
        id: product.id ?? productId,
        name: product.name ?? 'Produit',
        brandId: product.brandId ?? '',
        type: 'bijou',
        maxChars: 50,
        availableFonts: [],
      };
    } catch (error) {
      this.logger.error(
        `Failed to get product context: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return this.getDefaultProductContext();
    }
  }

  /**
   * Contexte produit par défaut en cas d'erreur
   */
  private getDefaultProductContext(): ProductContext {
    return {
      id: '',
      name: 'Produit',
      brandId: '',
      type: 'bijou',
      maxChars: 50,
      availableFonts: [],
    };
  }

  /**
   * Parse la réponse de suggestions rapides avec validation
   */
  private parseQuickSuggestResponse(content: string): AriaSuggestion[] {
    try {
      type QuickSuggestItem = Partial<{ text: string; style: string }>;
      type QuickSuggestResponse = QuickSuggestItem | Array<QuickSuggestItem>;
      const parsed = JSON.parse(content) as QuickSuggestResponse;

      // ✅ Gérer les deux formats possibles (objet unique ou array)
      const items = Array.isArray(parsed) ? parsed : [parsed];

      return items
        .map((item, index) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const text = typeof item.text === 'string' && item.text.trim().length > 0
            ? item.text.trim()
            : null;
          const style = typeof item.style === 'string' && item.style.trim().length > 0
            ? item.style.trim()
            : ['Classique', 'Moderne', 'Poétique', 'Original', 'Élégant', 'Romantique'][index] || 'Suggestion';

          if (!text) {
            return null;
          }

          const suggestion: AriaSuggestion = {
            type: 'text',
            value: text,
            label: style,
          };
          return suggestion;
        })
        .filter((suggestion): suggestion is AriaSuggestion => suggestion !== null)
        .slice(0, 6); // Limiter à 6 suggestions max
    } catch (error) {
      this.logger.warn(`Failed to parse quick suggest response: ${error instanceof Error ? error.message : 'Unknown'}`);
      return [];
    }
  }

  /**
   * Parse la réponse principale avec typage strict
   */
  private parseResponse(
    content: string,
    intent: AriaIntentType,
    context?: AriaMessage['context'],
  ): {
    message: string;
    suggestions: AriaSuggestion[];
    preview?: PersonalizationPreview;
  } {
    // ✅ Validation du contenu
    if (!content || typeof content !== 'string') {
      this.logger.warn('Empty content in parseResponse');
      return {
        message: '',
        suggestions: [],
      };
    }

    const suggestions = this.extractSuggestionsFromContent(content);
    const preview = this.buildPreviewFromContext(context);

    return {
      message: content.trim(),
      suggestions,
      preview,
    };
  }

  /**
   * Extrait les suggestions du contenu avec validation
   */
  private extractSuggestionsFromContent(content: string): AriaSuggestion[] {
    const suggestions: AriaSuggestion[] = [];

    // ✅ Extraction avec regex (méthode de fallback si JSON parsing échoue)
    const suggestionMatches = content.match(/"([^"]+)"/g);
    if (suggestionMatches && suggestionMatches.length > 0) {
      suggestionMatches.slice(0, 4).forEach((match, index) => {
        const value = match.replace(/"/g, '').trim();
        if (value.length > 0) {
          suggestions.push({
            type: 'text',
            value,
            label: ['Classique', 'Moderne', 'Poétique', 'Original'][index] || 'Suggestion',
          });
        }
      });
    }

    return suggestions;
  }

  /**
   * Construit l'aperçu depuis le contexte avec gardes
   */
  private buildPreviewFromContext(
    context?: AriaMessage['context'],
  ): PersonalizationPreview | undefined {
    if (!context || !context.currentText || typeof context.currentText !== 'string') {
      return undefined;
    }

    return {
      text: context.currentText.trim(),
      font: context.currentStyle?.font && typeof context.currentStyle.font === 'string'
        ? context.currentStyle.font.trim()
        : 'Playfair Display',
      color: context.currentStyle?.color && typeof context.currentStyle.color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(context.currentStyle.color.trim())
        ? context.currentStyle.color.trim()
        : '#333333',
    };
  }
}
