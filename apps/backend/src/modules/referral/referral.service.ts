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
   * Récupère les statistiques de referral pour un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Statistiques de referral (totalReferrals, activeReferrals, totalEarnings, etc.)
   * 
   * @remarks
   * Pour l'instant, retourne des stats basiques. Une implémentation complète nécessiterait :
   * - Modèle Referral dans Prisma pour tracker les referrals
   * - Modèle Commission pour tracker les commissions gagnées
   * - Logique de calcul des commissions basée sur les commandes des referrals
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

    // Générer ou récupérer le code de referral
    const referralCode = `REF-${userId.substring(0, 8).toUpperCase()}`;

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
}
