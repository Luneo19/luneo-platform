import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { LlmService } from '@/libs/llm/llm.service';
import { Prisma } from '@prisma/client';

export interface ImprovementSuggestion {
  type: 'faq' | 'prompt_improvement' | 'new_topic' | 'tone_adjustment';
  title: string;
  description: string;
  suggestedContent: string;
  confidence: number;
  basedOnConversations: string[];
}

export interface AnalysisResult {
  suggestions: ImprovementSuggestion[];
  qualityScore: number;
}

export interface LearnedQAPair {
  question: string;
  answer: string;
  conversationId: string;
  confidence: number;
  extractedAt: string;
}

export interface QualityDataPoint {
  date: string;
  qualityScore: number;
  conversations: number;
  avgSatisfaction: number | null;
  escalationRate: number;
  resolutionRate: number;
}

const ANALYSIS_SYSTEM_PROMPT = `You are an AI agent improvement analyst. You analyze conversation logs and generate actionable improvement suggestions.

Given a set of conversations between an AI agent and visitors, identify:
1. Questions the agent failed to answer or answered with low confidence
2. Common topics that appear frequently but aren't well-handled
3. Tone or style issues (too formal, too casual, unclear)
4. Opportunities for new FAQ entries

Reply ONLY with a JSON object:
{
  "suggestions": [
    {
      "type": "faq" | "prompt_improvement" | "new_topic" | "tone_adjustment",
      "title": "Short title",
      "description": "Why this improvement is needed",
      "suggestedContent": "The actual suggested content (FAQ answer, prompt change, etc.)",
      "confidence": 0.0-1.0,
      "basedOnConversations": ["conv_id_1", "conv_id_2"]
    }
  ],
  "qualityScore": 0.0-1.0
}

Quality score criteria:
- 1.0 = All questions answered confidently, positive sentiment, no escalations
- 0.7 = Most questions handled, few issues
- 0.5 = Mixed results, several gaps
- 0.3 = Many unanswered questions, negative sentiment
- 0.0 = Agent failing most interactions`;

const QA_EXTRACTION_PROMPT = `Extract key question-answer pairs from this conversation that could be added to a knowledge base.
Only extract pairs where the agent provided a helpful, accurate answer.

Reply ONLY with a JSON array:
[
  {
    "question": "The user's question (rephrased for clarity)",
    "answer": "The agent's answer (cleaned up)",
    "confidence": 0.0-1.0
  }
]

If no good Q&A pairs can be extracted, return an empty array: []`;

@Injectable()
export class ImprovementService {
  private readonly logger = new Logger(ImprovementService.name);

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly llmService: LlmService,
  ) {}

  async analyzeAndSuggest(agentId: string): Promise<AnalysisResult> {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, deletedAt: null },
    });
    if (!agent) {
      throw new NotFoundException(`Agent "${agentId}" not found`);
    }

    const conversations = await this.prisma.conversation.findMany({
      where: {
        agentId,
        deletedAt: null,
        messageCount: { gt: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            confidence: true,
            createdAt: true,
          },
        },
      },
    });

    if (conversations.length === 0) {
      return { suggestions: [], qualityScore: 1.0 };
    }

    const conversationSummaries = conversations.map((conv) => {
      const messages = conv.messages.map((m) => ({
        role: m.role,
        content: m.content.slice(0, 300),
        confidence: m.confidence,
      }));

      const lowConfidenceCount = conv.messages.filter(
        (m) => m.role === 'ASSISTANT' && m.confidence !== null && m.confidence < (agent.confidenceThreshold ?? 0.7),
      ).length;

      const unansweredPatterns = conv.messages.filter(
        (m) => m.role === 'USER' && m.content.includes('?'),
      ).length;

      return {
        id: conv.id,
        status: conv.status,
        sentiment: conv.sentiment,
        satisfaction: conv.satisfactionRating,
        messageCount: conv.messageCount,
        lowConfidenceCount,
        unansweredPatterns,
        messages: messages.slice(0, 10),
      };
    });

    const truncatedPayload = JSON.stringify(conversationSummaries).slice(0, 12000);

    try {
      const result = await this.llmService.complete({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Agent: "${agent.name}" (model: ${agent.model}, tone: ${agent.tone})\n\nConversations data:\n${truncatedPayload}`,
          },
        ],
        temperature: 0.2,
        maxTokens: 2000,
      });

      return this.parseAnalysisResult(result.content, conversations);
    } catch (error) {
      this.logger.error(
        `LLM analysis failed for agent ${agentId}, using heuristic fallback`,
        error instanceof Error ? error.message : String(error),
      );
      return this.heuristicAnalysis(agent, conversations);
    }
  }

  async autoLearn(agentId: string, conversationId: string): Promise<{ pairsExtracted: number }> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, agentId, deletedAt: null },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { role: true, content: true, confidence: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation "${conversationId}" not found for agent "${agentId}"`);
    }

    const isPositive =
      conversation.status === 'RESOLVED' ||
      (conversation.satisfactionRating !== null && conversation.satisfactionRating >= 4) ||
      conversation.sentiment === 'positive';

    if (!isPositive) {
      this.logger.debug(`Skipping auto-learn for conversation ${conversationId}: not positive outcome`);
      return { pairsExtracted: 0 };
    }

    const conversationText = conversation.messages
      .slice(0, 20)
      .map((m) => `[${m.role}]: ${m.content.slice(0, 500)}`)
      .join('\n');

    let pairs: LearnedQAPair[] = [];

    try {
      const result = await this.llmService.complete({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: QA_EXTRACTION_PROMPT },
          { role: 'user', content: conversationText },
        ],
        temperature: 0,
        maxTokens: 1000,
      });

      const parsed = this.parseQAPairs(result.content);
      pairs = parsed.map((p) => ({
        question: p.question,
        answer: p.answer,
        conversationId,
        confidence: p.confidence,
        extractedAt: new Date().toISOString(),
      }));
    } catch (error) {
      this.logger.warn(
        `LLM Q&A extraction failed for conversation ${conversationId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      pairs = this.extractQAPairsHeuristic(conversation.messages, conversationId);
    }

    if (pairs.length === 0) {
      return { pairsExtracted: 0 };
    }

    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    const existingMetadata = (agent?.metadata as Record<string, unknown>) ?? {};
    const existingPairs = (existingMetadata.learnedQAPairs as LearnedQAPair[]) ?? [];

    const merged = [...existingPairs, ...pairs].slice(-200);

    await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        metadata: {
          ...existingMetadata,
          learnedQAPairs: merged,
          lastAutoLearnAt: new Date().toISOString(),
          autoLearnCount: (existingMetadata.autoLearnCount as number ?? 0) + pairs.length,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Auto-learned ${pairs.length} Q&A pairs from conversation ${conversationId} for agent ${agentId}`);
    return { pairsExtracted: pairs.length };
  }

  async getQualityTimeline(agentId: string, days: number = 30): Promise<QualityDataPoint[]> {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, deletedAt: null },
    });
    if (!agent) {
      throw new NotFoundException(`Agent "${agentId}" not found`);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const dailyAnalytics = await this.prisma.agentDailyAnalytics.findMany({
      where: {
        agentId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    return dailyAnalytics.map((day) => {
      const totalResolved = day.autoResolved + day.humanResolved;
      const totalOutcomes = totalResolved + day.escalated + day.abandoned;

      const resolutionRate = totalOutcomes > 0 ? totalResolved / totalOutcomes : 1;
      const escalationRate = totalOutcomes > 0 ? day.escalated / totalOutcomes : 0;

      const satisfactionNorm = day.avgSatisfaction !== null ? day.avgSatisfaction / 5 : 0.7;
      const responseTimeNorm = day.avgResponseMs !== null ? Math.max(0, 1 - day.avgResponseMs / 10000) : 0.7;

      const qualityScore = Math.round(
        (resolutionRate * 0.35 + (1 - escalationRate) * 0.25 + satisfactionNorm * 0.25 + responseTimeNorm * 0.15) * 100,
      ) / 100;

      return {
        date: day.date.toISOString().split('T')[0],
        qualityScore: Math.max(0, Math.min(1, qualityScore)),
        conversations: day.conversations,
        avgSatisfaction: day.avgSatisfaction,
        escalationRate: Math.round(escalationRate * 100) / 100,
        resolutionRate: Math.round(resolutionRate * 100) / 100,
      };
    });
  }

  private parseAnalysisResult(
    raw: string,
    conversations: Array<{ id: string }>,
  ): AnalysisResult {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in LLM response');

      const parsed = JSON.parse(jsonMatch[0]);

      const validTypes = ['faq', 'prompt_improvement', 'new_topic', 'tone_adjustment'] as const;
      const conversationIds = new Set(conversations.map((c) => c.id));

      const suggestions: ImprovementSuggestion[] = Array.isArray(parsed.suggestions)
        ? parsed.suggestions
            .filter((s: Record<string, unknown>) => s && typeof s.title === 'string')
            .map((s: Record<string, unknown>) => ({
              type: validTypes.includes(s.type as typeof validTypes[number])
                ? (s.type as ImprovementSuggestion['type'])
                : 'new_topic',
              title: String(s.title).slice(0, 200),
              description: String(s.description ?? '').slice(0, 500),
              suggestedContent: String(s.suggestedContent ?? '').slice(0, 2000),
              confidence: typeof s.confidence === 'number'
                ? Math.max(0, Math.min(1, s.confidence))
                : 0.5,
              basedOnConversations: Array.isArray(s.basedOnConversations)
                ? (s.basedOnConversations as string[]).filter((id) => conversationIds.has(id))
                : [],
            }))
        : [];

      const qualityScore = typeof parsed.qualityScore === 'number'
        ? Math.max(0, Math.min(1, Math.round(parsed.qualityScore * 100) / 100))
        : 0.5;

      return { suggestions, qualityScore };
    } catch (error) {
      this.logger.warn(`Failed to parse LLM analysis result: ${error instanceof Error ? error.message : String(error)}`);
      return { suggestions: [], qualityScore: 0.5 };
    }
  }

  private heuristicAnalysis(
    agent: { id: string; name: string; confidenceThreshold: number },
    conversations: Array<{
      id: string;
      status: string;
      sentiment: string | null;
      satisfactionRating: number | null;
      messageCount: number;
      messages: Array<{ role: string; content: string; confidence: number | null }>;
    }>,
  ): AnalysisResult {
    const suggestions: ImprovementSuggestion[] = [];
    let totalScore = 0;
    let scoreCount = 0;

    const lowConfConversations: string[] = [];
    const longConversations: string[] = [];
    const negativeConversations: string[] = [];
    const questionBank = new Map<string, string[]>();

    for (const conv of conversations) {
      let convScore = 0.7;

      const lowConfMsgs = conv.messages.filter(
        (m) => m.role === 'ASSISTANT' && m.confidence !== null && m.confidence < agent.confidenceThreshold,
      );
      if (lowConfMsgs.length > 0) {
        lowConfConversations.push(conv.id);
        convScore -= 0.15 * lowConfMsgs.length;
      }

      if (conv.messageCount > 15) {
        longConversations.push(conv.id);
        convScore -= 0.1;
      }

      if (conv.sentiment === 'negative' || conv.sentiment === 'frustrated') {
        negativeConversations.push(conv.id);
        convScore -= 0.2;
      }

      if (conv.status === 'ESCALATED') {
        convScore -= 0.15;
      }

      if (conv.satisfactionRating !== null) {
        convScore = convScore * 0.5 + (conv.satisfactionRating / 5) * 0.5;
      }

      const userQuestions = conv.messages
        .filter((m) => m.role === 'USER' && m.content.includes('?'))
        .map((m) => m.content.slice(0, 100));

      for (const q of userQuestions) {
        const key = q.toLowerCase().replace(/[^a-zà-ÿ\s]/g, '').trim().slice(0, 50);
        if (key.length > 10) {
          const existing = questionBank.get(key) ?? [];
          existing.push(conv.id);
          questionBank.set(key, existing);
        }
      }

      totalScore += Math.max(0, Math.min(1, convScore));
      scoreCount++;
    }

    if (lowConfConversations.length >= 3) {
      suggestions.push({
        type: 'prompt_improvement',
        title: 'Améliorer le taux de confiance des réponses',
        description: `${lowConfConversations.length} conversations contiennent des réponses avec un score de confiance inférieur au seuil (${agent.confidenceThreshold}).`,
        suggestedContent: 'Enrichir la base de connaissances avec les sujets fréquemment mal compris ou ajouter des instructions plus détaillées dans le prompt système.',
        confidence: 0.8,
        basedOnConversations: lowConfConversations.slice(0, 5),
      });
    }

    if (longConversations.length >= 3) {
      suggestions.push({
        type: 'prompt_improvement',
        title: 'Réduire la longueur des conversations',
        description: `${longConversations.length} conversations dépassent 15 messages, suggérant des difficultés à résoudre les demandes rapidement.`,
        suggestedContent: 'Ajouter des réponses directes aux questions fréquentes et améliorer la structure du prompt pour des réponses plus concises.',
        confidence: 0.7,
        basedOnConversations: longConversations.slice(0, 5),
      });
    }

    if (negativeConversations.length >= 2) {
      suggestions.push({
        type: 'tone_adjustment',
        title: 'Ajuster le ton face aux sentiments négatifs',
        description: `${negativeConversations.length} conversations ont un sentiment négatif ou frustré.`,
        suggestedContent: 'Ajouter des instructions d\'empathie dans le prompt : reconnaître le problème, s\'excuser si nécessaire, proposer des solutions concrètes.',
        confidence: 0.75,
        basedOnConversations: negativeConversations.slice(0, 5),
      });
    }

    const frequentQuestions = Array.from(questionBank.entries())
      .filter(([, convIds]) => convIds.length >= 3)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3);

    for (const [question, convIds] of frequentQuestions) {
      suggestions.push({
        type: 'faq',
        title: `FAQ fréquente : "${question.slice(0, 60)}..."`,
        description: `Cette question apparaît dans ${convIds.length} conversations. Ajouter une entrée FAQ dédiée améliorerait la réactivité.`,
        suggestedContent: question,
        confidence: 0.65,
        basedOnConversations: [...new Set(convIds)].slice(0, 5),
      });
    }

    const qualityScore = scoreCount > 0
      ? Math.round((totalScore / scoreCount) * 100) / 100
      : 0.5;

    return {
      suggestions: suggestions.sort((a, b) => b.confidence - a.confidence),
      qualityScore: Math.max(0, Math.min(1, qualityScore)),
    };
  }

  private parseQAPairs(raw: string): Array<{ question: string; answer: string; confidence: number }> {
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(
          (p: Record<string, unknown>) =>
            typeof p.question === 'string' &&
            typeof p.answer === 'string' &&
            p.question.length > 5 &&
            p.answer.length > 5,
        )
        .map((p: Record<string, unknown>) => ({
          question: String(p.question).slice(0, 500),
          answer: String(p.answer).slice(0, 2000),
          confidence: typeof p.confidence === 'number' ? Math.max(0, Math.min(1, p.confidence)) : 0.5,
        }));
    } catch {
      this.logger.warn('Failed to parse Q&A pairs from LLM');
      return [];
    }
  }

  private extractQAPairsHeuristic(
    messages: Array<{ role: string; content: string; confidence: number | null }>,
    conversationId: string,
  ): LearnedQAPair[] {
    const pairs: LearnedQAPair[] = [];

    for (let i = 0; i < messages.length - 1; i++) {
      const userMsg = messages[i];
      const assistantMsg = messages[i + 1];

      if (
        userMsg.role !== 'USER' ||
        assistantMsg.role !== 'ASSISTANT' ||
        !userMsg.content.includes('?')
      ) {
        continue;
      }

      if (assistantMsg.confidence !== null && assistantMsg.confidence < 0.6) {
        continue;
      }

      if (userMsg.content.length < 10 || assistantMsg.content.length < 20) {
        continue;
      }

      pairs.push({
        question: userMsg.content.slice(0, 500),
        answer: assistantMsg.content.slice(0, 2000),
        conversationId,
        confidence: assistantMsg.confidence ?? 0.6,
        extractedAt: new Date().toISOString(),
      });
    }

    return pairs.slice(0, 10);
  }
}
