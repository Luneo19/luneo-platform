// @ts-nocheck
/**
 * Notification Dispatcher Service
 * Receives business events, creates persistent notifications in DB, and broadcasts via WebSocket.
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { RealtimeGateway } from '@/websocket/realtime.gateway';

export type OrderCreatedPayload = {
  orderId: string;
  orderNumber: string;
  totalCents: number;
  userId: string;
  brandId: string;
};

export type DesignCompletedPayload = {
  generationId: string;
  brandId: string;
  outputUrl?: string;
};

export type CommentAddedPayload = {
  projectId: string;
  commentId: string;
  brandId: string;
  userId: string;
  content: string;
};

export type PayoutCompletedPayload = {
  purchaseId: string;
  sellerUserId: string;
  brandId: string;
  amountCents: number;
};

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
    @Optional() private readonly realtimeGateway?: RealtimeGateway,
    @Optional() private readonly eventEmitter?: EventEmitter2,
  ) {}

  onModuleInit(): void {
    this.eventEmitter?.on('generation.completed', (payload: { generationId: string; imageUrl?: string }) => {
      this.handleGenerationCompleted(payload).catch((err) =>
        this.logger.warn('handleGenerationCompleted failed', { error: err instanceof Error ? err.message : String(err) }),
      );
    });
  }

  private async handleGenerationCompleted(payload: { generationId: string; imageUrl?: string }): Promise<void> {
    const gen = await this.prisma.generation.findUnique({
      where: { id: payload.generationId },
      select: { brandId: true },
    });
    if (gen) {
      await this.dispatchDesignCompleted({
        generationId: payload.generationId,
        brandId: gen.brandId,
        outputUrl: payload.imageUrl,
      });
    }
  }

  /**
   * Emit order.created: persist notification and broadcast to user + brand rooms
   */
  async dispatchOrderCreated(payload: OrderCreatedPayload): Promise<void> {
    try {
      await this.notificationsService.create({
        userId: payload.userId,
        type: 'order',
        title: 'Nouvelle commande',
        message: `Commande #${payload.orderNumber} créée (${(payload.totalCents / 100).toFixed(2)}€)`,
        data: { orderId: payload.orderId, orderNumber: payload.orderNumber },
        actionUrl: `/dashboard/orders`,
        actionLabel: 'Voir la commande',
      });

      // Notify the merchant (brand owner) as well
      if (payload.brandId) {
        const brandOwner = await this.prisma.user.findFirst({
          where: { brandId: payload.brandId },
          select: { id: true },
        });
        if (brandOwner && brandOwner.id !== payload.userId) {
          await this.notificationsService.create({
            userId: brandOwner.id,
            type: 'order',
            title: 'Nouvelle commande reçue',
            message: `Commande #${payload.orderNumber} — ${(payload.totalCents / 100).toFixed(2)}€`,
            data: { orderId: payload.orderId, orderNumber: payload.orderNumber },
            actionUrl: `/dashboard/orders`,
            actionLabel: 'Voir la commande',
          });
        }
      }

      this.realtimeGateway?.emitToUser(payload.userId, 'order.created', payload);
      this.realtimeGateway?.emitToBrand(payload.brandId, 'order.created', payload);
    } catch (err) {
      this.logger.warn('dispatchOrderCreated failed', { error: err instanceof Error ? err.message : String(err) });
    }
  }

  /**
   * Emit design.completed: persist notification for a brand user and broadcast to brand room
   */
  async dispatchDesignCompleted(payload: DesignCompletedPayload): Promise<void> {
    try {
      const brandUser = await this.prisma.user.findFirst({
        where: { brandId: payload.brandId },
        select: { id: true },
      });
      if (brandUser) {
        await this.notificationsService.create({
          userId: brandUser.id,
          type: 'success',
          title: 'Design généré',
          message: 'Votre génération IA est prête.',
          data: { generationId: payload.generationId, outputUrl: payload.outputUrl },
          actionUrl: payload.outputUrl ? undefined : '/dashboard/customize',
          actionLabel: 'Voir',
        });
      }
      this.realtimeGateway?.emitToBrand(payload.brandId, 'design.completed', payload);
    } catch (err) {
      this.logger.warn('dispatchDesignCompleted failed', { error: err instanceof Error ? err.message : String(err) });
    }
  }

  /**
   * Emit comment.added: persist notification for project owner (if not author) and broadcast to brand room
   */
  async dispatchCommentAdded(payload: CommentAddedPayload): Promise<void> {
    try {
      const project = await this.prisma.aRProject.findUnique({
        where: { id: payload.projectId },
        select: { ownerId: true },
      });
      const notifyUserId = project?.ownerId && project.ownerId !== payload.userId ? project.ownerId : null;
      if (notifyUserId) {
        await this.notificationsService.create({
          userId: notifyUserId,
          type: 'info',
          title: 'Nouveau commentaire',
          message: `Commentaire ajouté sur le projet collaboratif.`,
          data: { projectId: payload.projectId, commentId: payload.commentId },
          actionUrl: `/dashboard/ar-studio/collaboration?project=${payload.projectId}`,
          actionLabel: 'Voir',
        });
      }
      this.realtimeGateway?.emitToBrand(payload.brandId, 'comment.added', payload);
    } catch (err) {
      this.logger.warn('dispatchCommentAdded failed', { error: err instanceof Error ? err.message : String(err) });
    }
  }

  /**
   * Emit payout.completed: persist notification for seller and broadcast to user room
   */
  async dispatchPayoutCompleted(payload: PayoutCompletedPayload): Promise<void> {
    try {
      await this.notificationsService.create({
        userId: payload.sellerUserId,
        type: 'success',
        title: 'Paiement marketplace reçu',
        message: `Votre commission de ${(payload.amountCents / 100).toFixed(2)}€ a été versée.`,
        data: { purchaseId: payload.purchaseId },
        actionUrl: '/dashboard/seller',
        actionLabel: 'Voir les paiements',
      });
      this.realtimeGateway?.emitToUser(payload.sellerUserId, 'payout.completed', payload);
    } catch (err) {
      this.logger.warn('dispatchPayoutCompleted failed', { error: err instanceof Error ? err.message : String(err) });
    }
  }
}
