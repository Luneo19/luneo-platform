import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Crée ou récupère le code de referral pour un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Code de referral unique
   */
  private async getOrCreateReferralCode(userId: string): Promise<string> {
    // Vérifier si l'utilisateur a déjà un referral actif (en tant que referrer)
    const existingReferral = await this.prisma.referral.findFirst({
      where: {
        referrerId: userId,
      },
      select: {
        referralCode: true,
      },
    });

    if (existingReferral) {
      return existingReferral.referralCode;
    }

    // Générer un nouveau code de referral unique
    const baseCode = `REF-${userId.substring(0, 8).toUpperCase()}`;
    let referralCode = baseCode;
    let attempts = 0;

    // Vérifier l'unicité du code
    while (attempts < 10) {
      const existing = await this.prisma.referral.findFirst({
        where: { referralCode },
      });

      if (!existing) {
        break; // Code unique trouvé
      }

      // Générer un nouveau code avec un suffixe cryptographiquement sécurisé
      const randomBytes = require('crypto').randomBytes(3);
      const suffix = randomBytes.toString('hex').toUpperCase();
      referralCode = `${baseCode}-${suffix}`;
      attempts++;
    }

    return referralCode;
  }

  /**
   * Récupère les statistiques de referral pour un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Statistiques de referral (totalReferrals, activeReferrals, totalEarnings, etc.)
   */
  async getStats(userId: string) {
    // Récupérer l'utilisateur pour vérifier s'il existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, createdAt: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Récupérer ou créer le code de referral et le referral initial si nécessaire
    const referralCode = await this.getOrCreateReferralCode(userId);
    
    // S'assurer qu'un referral existe pour cet utilisateur (en tant que referrer)
    const existingReferral = await this.prisma.referral.findFirst({
      where: {
        referrerId: userId,
        referralCode,
      },
    });

    if (!existingReferral) {
      // Créer le referral initial pour cet utilisateur (sans referredUser)
      await this.prisma.referral.create({
        data: {
          referrerId: userId,
          referralCode,
          status: 'PENDING', // Pending jusqu'à ce qu'un utilisateur soit référé
        },
      });
      this.logger.log(`Created initial referral for user ${userId} with code ${referralCode}`);
    }

    // Compter les referrals actifs
    const referrals = await this.prisma.referral.findMany({
      where: {
        referrerId: userId,
      },
      include: {
        commissions: true,
      },
    });

    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter((r) => r.status === 'ACTIVE').length;

    // Calculer les gains totaux et en attente
    const allCommissions = referrals.flatMap((r) => r.commissions);
    const totalEarnings = allCommissions
      .filter((c) => c.status === 'PAID')
      .reduce((sum, c) => sum + c.amountCents, 0) / 100; // Convertir en euros
    const pendingEarnings = allCommissions
      .filter((c) => c.status === 'PENDING' || c.status === 'APPROVED')
      .reduce((sum, c) => sum + c.amountCents, 0) / 100; // Convertir en euros

    // Récupérer les referrals récents
    const recentReferrals = referrals
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        referredUserId: r.referredUserId,
        status: r.status,
        createdAt: r.createdAt,
        completedAt: r.completedAt,
      }));

    return {
      totalReferrals,
      activeReferrals,
      totalEarnings,
      pendingEarnings,
      referralCode,
      referralLink: `${this.configService.get('app.frontendUrl') || 'https://www.luneo.app'}/signup?ref=${userId.substring(0, 8)}`,
      recentReferrals,
    };
  }

  /**
   * Join referral program (public, no auth required)
   */
  async join(email: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Referral program join request: ${email.replace(/(.{2}).*@/, '$1***@')}`);

    // Enregistrer dans la base de données
    try {
      await this.prisma.referralApplication.upsert({
        where: { email },
        update: { status: 'pending', appliedAt: new Date() },
        create: { email, status: 'pending', appliedAt: new Date() },
      });
    } catch (error) {
      this.logger.warn('Failed to save referral application', { error });
    }

    // Envoyer email via service email (à implémenter)
    const sendGridKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (sendGridKey) {
      try {
        // Email à l'équipe
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendGridKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: 'affiliate@luneo.app' }],
              subject: `Nouvelle demande d'affiliation - ${email}`,
            }],
            from: { email: 'noreply@luneo.app', name: 'Luneo System' },
            content: [{
              type: 'text/html',
              value: `
                <div style="font-family: Arial, sans-serif;">
                  <h2>Nouvelle demande d'affiliation</h2>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
                </div>
              `,
            }],
          }),
        });

        // Email de confirmation au demandeur
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendGridKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email }],
              subject: 'Votre demande d\'affiliation Luneo',
            }],
            from: { email: 'affiliate@luneo.app', name: 'Luneo Affiliation' },
            content: [{
              type: 'text/html',
              value: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #9333ea;">Merci pour votre intérêt !</h2>
                  <p>Bonjour,</p>
                  <p>Nous avons bien reçu votre demande pour rejoindre le programme d'affiliation Luneo.</p>
                  <p>Notre équipe va examiner votre candidature et vous recontactera sous 24 à 48h avec tous les détails pour commencer.</p>
                  <p>En attendant, n'hésitez pas à créer un compte sur <a href="${this.configService.get('app.frontendUrl') || 'https://luneo.app'}/register" style="color: #9333ea;">Luneo</a> si ce n'est pas déjà fait.</p>
                  <p style="margin-top: 30px;">À très vite,<br/>L'équipe Luneo</p>
                </div>
              `,
            }],
          }),
        });
      } catch (emailError) {
        this.logger.warn('Email notification failed', { error: emailError });
      }
    }

    return {
      success: true,
      message: 'Demande envoyée avec succès',
    };
  }

  /**
   * Demande de retrait des commissions
   * @param userId - ID de l'utilisateur qui demande le retrait
   * @returns Détails de la demande de retrait (withdrawalId, amount, status, message)
   * 
   * @throws BadRequestException si le montant minimum n'est pas atteint ou si l'utilisateur n'existe pas
   * 
   * @remarks
   * Pour une implémentation complète, il faudrait :
   * - Modèle Commission dans Prisma pour tracker les commissions
   * - Modèle Withdrawal dans Prisma pour tracker les retraits
   * - Champ IBAN dans User ou dans un modèle UserProfile séparé
   * - Validation IBAN et intégration avec un service de paiement (Stripe, etc.)
   */
  async withdraw(userId: string): Promise<{ withdrawalId: string; amount: number; status: string; message: string }> {
    // Vérifier le montant disponible depuis les commissions
    const commissions = await this.prisma.commission.findMany({
      where: {
        userId,
        status: {
          in: ['PENDING', 'APPROVED'],
        },
      },
    });

    const totalPendingCents = commissions.reduce((sum, c) => sum + c.amountCents, 0);
    const totalPending = totalPendingCents / 100; // Convertir en euros

    if (totalPending < 50) {
      throw new BadRequestException('Montant minimum de retrait non atteint (50€)');
    }

    // Récupérer les informations bancaires de l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        userProfile: {
          select: {
            iban: true,
            bic: true,
            bankName: true,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Vérifier IBAN depuis profil
    if (!user.userProfile?.iban) {
      throw new BadRequestException('Veuillez configurer vos informations bancaires dans les paramètres');
    }

    // Créer la demande de retrait
    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        userId,
        amountCents: totalPendingCents,
        iban: user.userProfile.iban,
        status: 'PENDING',
      },
    });

    // Marquer les commissions comme en cours de traitement
    await this.prisma.commission.updateMany({
      where: {
        id: {
          in: commissions.map((c) => c.id),
        },
      },
      data: {
        status: 'APPROVED', // Les commissions sont approuvées pour le retrait
      },
    });

    // Notifier l'équipe
    const sendGridKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (sendGridKey) {
      try {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendGridKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: 'finance@luneo.app' }],
              subject: `[Retrait] ${withdrawal.id} - ${totalPending.toFixed(2)}€`,
            }],
            from: { email: 'noreply@luneo.app', name: 'Luneo System' },
            content: [{
              type: 'text/html',
              value: `
                <h2>Nouvelle demande de retrait</h2>
                <p><strong>ID:</strong> ${withdrawal.id}</p>
                <p><strong>Utilisateur:</strong> ${user.email}</p>
                <p><strong>Montant:</strong> ${totalPending.toFixed(2)}€</p>
                <p><strong>IBAN:</strong> ${user.userProfile?.iban?.substring(0, 4)}****${user.userProfile?.iban?.substring(user.userProfile.iban.length - 4)}</p>
              `,
            }],
          }),
        });
      } catch (emailError) {
        this.logger.warn('Withdrawal notification email failed', { error: emailError });
      }
    }

    this.logger.log('Withdrawal requested', {
      withdrawalId: withdrawal.id,
      userId,
      amount: totalPending,
    });

    return {
      withdrawalId: withdrawal.id,
      amount: totalPending,
      status: withdrawal.status.toLowerCase(),
      message: 'Demande de retrait enregistrée. Paiement sous 3-5 jours ouvrés.',
    };
  }

  /**
   * Enregistre un nouveau referral lors de l'inscription d'un utilisateur
   * @param referredUserId - ID du nouvel utilisateur référé
   * @param referralCode - Code de referral utilisé lors de l'inscription
   * @returns Referral créé ou null si code invalide
   */
  async recordReferral(
    referredUserId: string,
    referralCode: string,
  ): Promise<{ id: string; referrerId: string } | null> {
    try {
      // Normaliser le code de referral
      const normalizedCode = referralCode.toUpperCase().trim();

      // Trouver le referral existant correspondant au code
      let referral = await this.prisma.referral.findFirst({
        where: { referralCode: normalizedCode },
        select: {
          id: true,
          referrerId: true,
          referredUserId: true,
          status: true,
        },
      });

      // Si le referral n'existe pas, essayer de l'extraire depuis le code
      // Format attendu: REF-{userId} ou juste {userId}
      if (!referral) {
        // Essayer d'extraire l'ID utilisateur depuis le code
        const codeMatch = normalizedCode.match(/REF[-_]?([A-Z0-9]{8,})/);
        if (codeMatch) {
          const potentialReferrerId = codeMatch[1].toLowerCase();
          // Chercher un utilisateur avec cet ID
          const potentialReferrer = await this.prisma.user.findUnique({
            where: { id: potentialReferrerId },
            select: { id: true },
          });

          if (potentialReferrer) {
            // Créer un nouveau referral pour cet utilisateur
            referral = await this.prisma.referral.create({
              data: {
                referrerId: potentialReferrer.id,
                referralCode: normalizedCode,
                status: 'PENDING',
                createdAt: new Date(),
                completedAt: new Date(),
              },
              select: {
                id: true,
                referrerId: true,
                referredUserId: true,
                status: true,
              },
            });
          }
        }

        // Si toujours pas trouvé, chercher par code simplifié (sans préfixe REF-)
        if (!referral) {
          const simplifiedCode = normalizedCode.replace(/^REF[-_]?/, '');
          if (simplifiedCode.length >= 8) {
            const potentialReferrer = await this.prisma.user.findFirst({
              where: {
                id: {
                  startsWith: simplifiedCode.toLowerCase(),
                },
              },
              select: { id: true },
            });

            if (potentialReferrer) {
              // Créer le code de referral et le referral
              const generatedCode = `REF-${potentialReferrer.id.substring(0, 8).toUpperCase()}`;
              referral = await this.prisma.referral.create({
                data: {
                  referrerId: potentialReferrer.id,
                  referralCode: generatedCode,
                  status: 'PENDING',
                },
                select: {
                  id: true,
                  referrerId: true,
                  referredUserId: true,
                  status: true,
                },
              });
            }
          }
        }
      }

      if (!referral) {
        this.logger.warn(`Invalid referral code: ${referralCode}`);
        return null;
      }

      // Vérifier que le referral n'a pas déjà été utilisé
      if (referral.referredUserId || referral.status === 'COMPLETED') {
        this.logger.warn(
          `Referral code already used: ${referralCode}`,
        );
        return null;
      }

      // Vérifier que l'utilisateur ne se réfère pas lui-même
      if (referral.referrerId === referredUserId) {
        this.logger.warn(
          `User cannot refer themselves: ${referredUserId}`,
        );
        return null;
      }

      // Mettre à jour le referral avec le nouvel utilisateur référé
      const updatedReferral = await this.prisma.referral.update({
        where: { id: referral.id },
        data: {
          referredUserId,
          status: 'ACTIVE',
          completedAt: new Date(),
        },
        select: {
          id: true,
          referrerId: true,
        },
      });

      this.logger.log(
        `Referral recorded: ${referral.referrerId} -> ${referredUserId} (code: ${referralCode})`,
      );

      return updatedReferral;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to record referral: ${error instanceof Error ? errorMessage : 'Unknown error'}`,
        error instanceof Error ? errorStack : undefined,
      );
      return null;
    }
  }

  /**
   * Crée une commission automatiquement lorsqu'un utilisateur référé passe une commande
   * @param orderId - ID de la commande
   * @param referredUserId - ID de l'utilisateur référé qui a passé la commande
   * @param orderAmountCents - Montant de la commande en centimes
   * @param commissionPercentage - Pourcentage de commission (par défaut 10%)
   * @returns Commission créée ou null si pas de referral actif
   */
  async createCommissionFromOrder(
    orderId: string,
    referredUserId: string,
    orderAmountCents: number,
    commissionPercentage: number = 10,
  ): Promise<{ id: string; amountCents: number } | null> {
    try {
      // Trouver le referral actif pour cet utilisateur
      const referral = await this.prisma.referral.findUnique({
        where: {
          referredUserId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          referrerId: true,
        },
      });

      if (!referral) {
        // Pas de referral actif, pas de commission
        return null;
      }

      // Vérifier qu'une commission n'existe pas déjà pour cette commande
      const existingCommission = await this.prisma.commission.findFirst({
        where: {
          orderId,
          referralId: referral.id,
        },
      });

      if (existingCommission) {
        this.logger.warn(
          `Commission already exists for order ${orderId} and referral ${referral.id}`,
        );
        return existingCommission;
      }

      // Calculer le montant de la commission
      const commissionAmountCents = Math.round(
        (orderAmountCents * commissionPercentage) / 100,
      );

      // Créer la commission
      const commission = await this.prisma.commission.create({
        data: {
          referralId: referral.id,
          userId: referral.referrerId,
          orderId,
          amountCents: commissionAmountCents,
          percentage: commissionPercentage,
          status: 'PENDING',
        },
        select: {
          id: true,
          amountCents: true,
        },
      });

      this.logger.log(
        `Commission created: ${commission.id} (${commissionAmountCents / 100}€ from order ${orderId})`,
      );

      return commission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to create commission from order: ${error instanceof Error ? errorMessage : 'Unknown error'}`,
        error instanceof Error ? errorStack : undefined,
      );
      return null;
    }
  }

  /**
   * Approuve une commission (après validation manuelle ou automatique)
   * @param commissionId - ID de la commission
   * @returns Commission approuvée
   */
  async approveCommission(
    commissionId: string,
  ): Promise<{ id: string; status: string }> {
    const commission = await this.prisma.commission.update({
      where: { id: commissionId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
      },
    });

    this.logger.log(`Commission approved: ${commissionId}`);
    return commission;
  }

  /**
   * Marque une commission comme payée (après traitement du retrait)
   * @param commissionId - ID de la commission
   * @returns Commission marquée comme payée
   */
  async markCommissionAsPaid(
    commissionId: string,
  ): Promise<{ id: string; status: string }> {
    const commission = await this.prisma.commission.update({
      where: { id: commissionId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
      select: {
        id: true,
        status: true,
      },
    });

    this.logger.log(`Commission marked as paid: ${commissionId}`);
    return commission;
  }
}
