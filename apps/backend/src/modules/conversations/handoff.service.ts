import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { SentimentAnalysisService } from '@/modules/agent-analytics/sentiment-analysis.service';
import { EmailService } from '@/modules/email/email.service';
import { ConversationStatus } from '@prisma/client';

export interface HandoffEvaluation {
  shouldHandoff: boolean;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  method: 'confidence_threshold' | 'frustration_detected' | 'user_request' | 'sensitive_topic';
}

export interface HandoffResult {
  success: boolean;
  notifiedChannels: string[];
}

export interface HandoffFeedbackInput {
  conversationId: string;
  feedbackType: 'false_positive' | 'good_escalation' | 'late_escalation';
  note?: string;
}

export interface EscalationQueueItem {
  conversationId: string;
  agentId: string;
  agentName: string;
  visitorName: string | null;
  visitorEmail: string | null;
  escalationReason: string | null;
  escalationPriority: string | null;
  messageCount: number;
  escalatedAt: Date | null;
  createdAt: Date;
  lastMessagePreview: string | null;
}

const FRUSTRATION_KEYWORDS_FR = [
  'parler à un humain',
  'parler a un humain',
  'agent humain',
  'vrai personne',
  'responsable',
  'superviseur',
  'manager',
  'ça suffit',
  'ca suffit',
  'ras le bol',
  'insupportable',
  'inacceptable',
  'inadmissible',
  'ridicule',
  'incompétent',
  'incompetent',
  'nul',
  'inutile',
  'je veux un humain',
  'transférer',
  'transferer',
  'escalader',
];

const FRUSTRATION_KEYWORDS_EN = [
  'talk to a human',
  'speak to someone',
  'real person',
  'supervisor',
  'manager',
  'this is useless',
  'fed up',
  'unacceptable',
  'ridiculous',
  'incompetent',
  'transfer me',
  'escalate',
  'i want a human',
  'let me talk to',
];

const USER_REQUEST_PATTERNS = [
  /parler?\s*(à|a)\s*(un|une)?\s*(humain|personne|agent|conseiller)/i,
  /transf[ée]rer?\s*(moi|ma)/i,
  /je\s+veux\s+(un|parler)/i,
  /talk\s+to\s+(a\s+)?(human|person|agent|someone|representative)/i,
  /transfer\s+me/i,
  /i\s+want\s+(a\s+)?(human|person|real)/i,
  /speak\s+(to|with)\s+(a\s+)?(human|person|someone)/i,
];

const SENSITIVE_TOPICS = [
  'remboursement', 'refund',
  'litige', 'dispute',
  'plainte', 'complaint',
  'avocat', 'lawyer', 'juridique', 'legal',
  'rgpd', 'gdpr', 'données personnelles', 'personal data',
  'harcèlement', 'harassment',
  'discrimination',
  'facturation', 'billing',
  'fraude', 'fraud',
  'sécurité', 'security breach',
  'urgence', 'emergency',
  'résiliation', 'cancellation',
];

const MAX_BACK_AND_FORTH_THRESHOLD = 12;

@Injectable()
export class HandoffService {
  private readonly logger = new Logger(HandoffService.name);

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly sentimentService: SentimentAnalysisService,
    @Optional() private readonly emailService?: EmailService,
  ) {}

  async evaluateHandoff(
    conversationId: string,
    latestMessage: string,
    aiConfidence: number,
  ): Promise<HandoffEvaluation> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, deletedAt: null },
      include: {
        agent: {
          select: {
            id: true,
            confidenceThreshold: true,
            autoEscalate: true,
            escalationConditions: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { role: true, content: true },
          take: 30,
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation "${conversationId}" not found`);
    }

    if (!conversation.agent.autoEscalate) {
      return {
        shouldHandoff: false,
        reason: 'Auto-escalation is disabled for this agent',
        priority: 'low',
        method: 'confidence_threshold',
      };
    }

    const lowerMessage = latestMessage.toLowerCase();

    if (this.isUserRequestingHuman(lowerMessage)) {
      return {
        shouldHandoff: true,
        reason: 'Le visiteur a explicitement demandé à parler à un humain',
        priority: 'high',
        method: 'user_request',
      };
    }

    const sensitiveTopic = this.detectSensitiveTopic(lowerMessage);
    if (sensitiveTopic) {
      return {
        shouldHandoff: true,
        reason: `Sujet sensible détecté : ${sensitiveTopic}`,
        priority: 'urgent',
        method: 'sensitive_topic',
      };
    }

    const confidenceThreshold = conversation.agent.confidenceThreshold ?? 0.7;
    if (aiConfidence < confidenceThreshold) {
      const recentLowConfidence = await this.countRecentLowConfidenceMessages(
        conversationId,
        confidenceThreshold,
      );

      if (recentLowConfidence >= 2) {
        return {
          shouldHandoff: true,
          reason: `Confiance IA trop basse (${aiConfidence.toFixed(2)}) – ${recentLowConfidence} réponses consécutives sous le seuil de ${confidenceThreshold}`,
          priority: 'medium',
          method: 'confidence_threshold',
        };
      }
    }

    const frustration = await this.detectFrustration(lowerMessage, conversation.messages);
    if (frustration.detected) {
      return {
        shouldHandoff: true,
        reason: frustration.reason,
        priority: frustration.severe ? 'urgent' : 'high',
        method: 'frustration_detected',
      };
    }

    const userMessageCount = conversation.messages.filter((m) => m.role === 'USER').length;
    if (userMessageCount >= MAX_BACK_AND_FORTH_THRESHOLD) {
      return {
        shouldHandoff: true,
        reason: `Conversation trop longue (${userMessageCount} messages utilisateur) – probable difficulté à résoudre la demande`,
        priority: 'medium',
        method: 'frustration_detected',
      };
    }

    return {
      shouldHandoff: false,
      reason: 'Aucun critère d\'escalade détecté',
      priority: 'low',
      method: 'confidence_threshold',
    };
  }

  async executeHandoff(
    conversationId: string,
    reason: string,
    priority: string,
  ): Promise<HandoffResult> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, deletedAt: null },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            escalationEmail: true,
            escalationMessage: true,
            organizationId: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation "${conversationId}" not found`);
    }

    if (conversation.status === ConversationStatus.ESCALATED) {
      this.logger.debug(`Conversation ${conversationId} is already escalated`);
      return { success: true, notifiedChannels: [] };
    }

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: ConversationStatus.ESCALATED,
        escalatedAt: new Date(),
        escalationReason: reason,
        escalationPriority: priority,
        isUrgent: priority === 'urgent',
      },
    });

    const notifiedChannels: string[] = ['database'];

    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'SYSTEM',
        content: conversation.agent.escalationMessage
          ?? `Cette conversation a été transférée à un agent humain. Motif : ${reason}. Un membre de l'équipe vous répondra sous peu.`,
        contentType: 'text',
      },
    });
    notifiedChannels.push('in_conversation_notice');

    if (this.emailService && conversation.agent.escalationEmail) {
      try {
        await this.emailService.sendEmail({
          to: conversation.agent.escalationEmail,
          subject: `[${priority.toUpperCase()}] Escalade – ${conversation.agent.name} – Conv. ${conversationId.slice(-8)}`,
          html: this.buildEscalationEmailHtml(conversation, reason, priority),
          text: `Escalade de conversation\n\nAgent: ${conversation.agent.name}\nConversation: ${conversationId}\nMotif: ${reason}\nPriorité: ${priority}\nVisiteur: ${conversation.visitorName ?? conversation.visitorEmail ?? 'Anonyme'}`,
          tags: ['escalation', `priority-${priority}`],
        });
        notifiedChannels.push('email');
        this.logger.log(`Escalation email sent to ${conversation.agent.escalationEmail}`);
      } catch (error) {
        this.logger.error(
          `Failed to send escalation email: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log(
      `Handoff executed for conversation ${conversationId}: reason="${reason}", priority=${priority}, channels=[${notifiedChannels.join(', ')}]`,
    );

    return { success: true, notifiedChannels };
  }

  async getEscalationQueue(organizationId: string): Promise<EscalationQueueItem[]> {
    const priorityOrder: Record<string, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    const conversations = await this.prisma.conversation.findMany({
      where: {
        organizationId,
        status: ConversationStatus.ESCALATED,
        deletedAt: null,
      },
      orderBy: [{ isUrgent: 'desc' }, { escalatedAt: 'asc' }],
      include: {
        agent: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true },
        },
      },
    });

    const queue: EscalationQueueItem[] = conversations
      .map((conv) => ({
        conversationId: conv.id,
        agentId: conv.agent.id,
        agentName: conv.agent.name,
        visitorName: conv.visitorName,
        visitorEmail: conv.visitorEmail,
        escalationReason: conv.escalationReason,
        escalationPriority: conv.escalationPriority,
        messageCount: conv.messageCount,
        escalatedAt: conv.escalatedAt,
        createdAt: conv.createdAt,
        lastMessagePreview: conv.messages[0]?.content.slice(0, 200) ?? null,
      }))
      .sort((a, b) => {
        const pa = priorityOrder[a.escalationPriority ?? 'low'] ?? 3;
        const pb = priorityOrder[b.escalationPriority ?? 'low'] ?? 3;
        if (pa !== pb) return pa - pb;
        const ta = a.escalatedAt?.getTime() ?? 0;
        const tb = b.escalatedAt?.getTime() ?? 0;
        return ta - tb;
      });

    return queue;
  }

  async recordHandoffFeedback(input: HandoffFeedbackInput) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: input.conversationId },
      select: {
        id: true,
        escalationReason: true,
        agentId: true,
        organizationId: true,
      },
    });
    if (!conversation) {
      throw new NotFoundException(`Conversation "${input.conversationId}" not found`);
    }

    await this.prisma.analyticsEvent.create({
      data: {
        organizationId: conversation.organizationId,
        eventType: 'handoff_feedback',
        sessionId: conversation.id,
        properties: {
          agentId: conversation.agentId,
          escalationReason: conversation.escalationReason,
          feedbackType: input.feedbackType,
          note: input.note,
        },
      },
    });

    return { recorded: true };
  }

  async getOperationalMetrics(
    organizationId: string,
    dateRange: { from: Date; to: Date },
  ) {
    const [escalated, resolvedAfterEscalation, feedbackEvents] = await Promise.all([
      this.prisma.conversation.count({
        where: {
          organizationId,
          status: ConversationStatus.ESCALATED,
          escalatedAt: { gte: dateRange.from, lte: dateRange.to },
          deletedAt: null,
        },
      }),
      this.prisma.conversation.count({
        where: {
          organizationId,
          resolvedBy: 'HUMAN',
          resolvedAt: { gte: dateRange.from, lte: dateRange.to },
          deletedAt: null,
        },
      }),
      this.prisma.analyticsEvent.findMany({
        where: {
          organizationId,
          eventType: 'handoff_feedback',
          createdAt: { gte: dateRange.from, lte: dateRange.to },
        },
        select: { properties: true },
      }),
    ]);

    const feedbackBuckets = {
      falsePositive: 0,
      goodEscalation: 0,
      lateEscalation: 0,
    };
    for (const event of feedbackEvents) {
      const props = (event.properties ?? {}) as Record<string, unknown>;
      const type = props.feedbackType;
      if (type === 'false_positive') feedbackBuckets.falsePositive += 1;
      if (type === 'good_escalation') feedbackBuckets.goodEscalation += 1;
      if (type === 'late_escalation') feedbackBuckets.lateEscalation += 1;
    }

    const totalFeedback =
      feedbackBuckets.falsePositive +
      feedbackBuckets.goodEscalation +
      feedbackBuckets.lateEscalation;
    const precision =
      totalFeedback > 0
        ? Math.round((feedbackBuckets.goodEscalation / totalFeedback) * 10000) / 100
        : 0;

    return {
      escalated,
      resolvedAfterEscalation,
      feedback: feedbackBuckets,
      handoffPrecisionPct: precision,
    };
  }

  private isUserRequestingHuman(message: string): boolean {
    return USER_REQUEST_PATTERNS.some((pattern) => pattern.test(message));
  }

  private detectSensitiveTopic(message: string): string | null {
    for (const topic of SENSITIVE_TOPICS) {
      if (message.includes(topic)) {
        return topic;
      }
    }
    return null;
  }

  private async countRecentLowConfidenceMessages(
    conversationId: string,
    threshold: number,
  ): Promise<number> {
    const recentAssistantMessages = await this.prisma.message.findMany({
      where: {
        conversationId,
        role: 'ASSISTANT',
        confidence: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { confidence: true },
    });

    let streak = 0;
    for (const msg of recentAssistantMessages) {
      if (msg.confidence !== null && msg.confidence < threshold) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private async detectFrustration(
    latestMessage: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<{ detected: boolean; reason: string; severe: boolean }> {
    const allKeywords = [...FRUSTRATION_KEYWORDS_FR, ...FRUSTRATION_KEYWORDS_EN];
    const matchedKeywords = allKeywords.filter((kw) => latestMessage.includes(kw));

    if (matchedKeywords.length >= 2) {
      return {
        detected: true,
        reason: `Frustration élevée détectée : multiples indicateurs (${matchedKeywords.slice(0, 3).join(', ')})`,
        severe: true,
      };
    }

    if (matchedKeywords.length === 1) {
      return {
        detected: true,
        reason: `Frustration détectée : "${matchedKeywords[0]}"`,
        severe: false,
      };
    }

    try {
      const userMessages = messages
        .filter((m) => m.role === 'USER')
        .slice(-5);

      if (userMessages.length >= 3) {
        const result = await this.sentimentService.analyzeConversation(
          userMessages.map((m) => ({ role: 'user', content: m.content })),
        );

        if (result.frustrationDetected || result.escalationRecommended) {
          return {
            detected: true,
            reason: `Analyse de sentiment : frustration détectée sur les derniers messages (sentiment global : ${result.overallSentiment})`,
            severe: result.escalationRecommended,
          };
        }
      }
    } catch (error) {
      this.logger.warn(
        `Sentiment analysis failed during frustration detection: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return { detected: false, reason: '', severe: false };
  }

  private buildEscalationEmailHtml(
    conversation: {
      id: string;
      visitorName: string | null;
      visitorEmail: string | null;
      visitorPhone: string | null;
      messageCount: number;
      agent: { name: string; organizationId: string };
    },
    reason: string,
    priority: string,
  ): string {
    const priorityColor: Record<string, string> = {
      urgent: '#dc2626',
      high: '#ea580c',
      medium: '#ca8a04',
      low: '#16a34a',
    };
    const color = priorityColor[priority] ?? '#6366f1';
    const visitor = conversation.visitorName ?? conversation.visitorEmail ?? 'Anonyme';

    return `
<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:-apple-system,sans-serif;margin:0;padding:20px;background:#f4f4f5">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
  <div style="background:${color};padding:20px;color:#fff">
    <h2 style="margin:0">Escalade ${priority.toUpperCase()}</h2>
    <p style="margin:5px 0 0;opacity:0.9">Agent : ${conversation.agent.name}</p>
  </div>
  <div style="padding:20px">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#666;width:140px">Conversation</td><td style="padding:8px 0;font-weight:600">${conversation.id}</td></tr>
      <tr><td style="padding:8px 0;color:#666">Visiteur</td><td style="padding:8px 0">${visitor}</td></tr>
      ${conversation.visitorPhone ? `<tr><td style="padding:8px 0;color:#666">Téléphone</td><td style="padding:8px 0">${conversation.visitorPhone}</td></tr>` : ''}
      <tr><td style="padding:8px 0;color:#666">Messages</td><td style="padding:8px 0">${conversation.messageCount}</td></tr>
      <tr><td style="padding:8px 0;color:#666">Motif</td><td style="padding:8px 0">${reason}</td></tr>
      <tr><td style="padding:8px 0;color:#666">Priorité</td><td style="padding:8px 0"><span style="background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px">${priority.toUpperCase()}</span></td></tr>
    </table>
    <p style="margin-top:20px;text-align:center">
      <a href="#" style="background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">Voir la conversation</a>
    </p>
  </div>
  <div style="padding:15px 20px;text-align:center;font-size:12px;color:#71717a;border-top:1px solid #e4e4e7">
    Luneo – Notification d'escalade automatique
  </div>
</div>
</body></html>`;
  }
}
