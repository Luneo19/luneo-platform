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

  async getStats(userId: string) {
    // Pour l'instant, retourner des stats basiques
    // TODO: Implémenter la logique de referral complète avec un modèle Referral dans Prisma
    
    // Compter les utilisateurs qui ont été invités par cet utilisateur
    // (basé sur une relation future ou un champ referralCode)
    const totalReferrals = 0; // À implémenter avec le modèle Referral
    const activeReferrals = 0;
    const totalEarnings = 0;
    const pendingEarnings = 0;

    return {
      totalReferrals,
      activeReferrals,
      totalEarnings,
      pendingEarnings,
      referralCode: `REF-${userId.substring(0, 8).toUpperCase()}`,
      referralLink: `${this.configService.get('app.frontendUrl') || 'https://www.luneo.app'}/signup?ref=${userId.substring(0, 8)}`,
      recentReferrals: [],
    };
  }

  /**
   * Join referral program (public, no auth required)
   */
  async join(email: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Referral program join request: ${email.replace(/(.{2}).*@/, '$1***@')}`);

    // Enregistrer dans la base de données si une table existe
    // Pour l'instant, on utilise juste l'email service
    try {
      // TODO: Créer table referral_applications si nécessaire
      // await this.prisma.referralApplication.upsert({
      //   where: { email },
      //   update: { status: 'pending', appliedAt: new Date() },
      //   create: { email, status: 'pending', appliedAt: new Date() },
      // });
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
   * Request withdrawal of commissions
   */
  async withdraw(userId: string): Promise<{ withdrawalId: string; amount: number; status: string; message: string }> {
    // Vérifier le montant disponible
    // TODO: Implémenter avec le modèle Commission dans Prisma
    // Pour l'instant, vérifier dans une table commissions si elle existe
    const totalPending = 0; // À implémenter
    
    if (totalPending < 50) {
      throw new BadRequestException('Montant minimum de retrait non atteint (50€)');
    }

    // Récupérer les informations bancaires de l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        // TODO: Ajouter champ iban dans User ou dans un profil séparé
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // TODO: Vérifier IBAN depuis profil ou settings
    // const profile = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    // if (!profile?.iban) {
    //   throw new BadRequestException('Veuillez configurer vos informations bancaires dans les paramètres');
    // }

    // Créer la demande de retrait
    const withdrawalId = `WD-${Date.now().toString(36).toUpperCase()}`;

    // TODO: Créer withdrawal dans Prisma
    // await this.prisma.withdrawal.create({
    //   data: {
    //     id: withdrawalId,
    //     userId,
    //     amount: totalPending,
    //     status: 'pending',
    //     iban: profile.iban,
    //   },
    // });

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
              subject: `[Retrait] ${withdrawalId} - ${totalPending.toFixed(2)}€`,
            }],
            from: { email: 'noreply@luneo.app', name: 'Luneo System' },
            content: [{
              type: 'text/html',
              value: `
                <h2>Nouvelle demande de retrait</h2>
                <p><strong>ID:</strong> ${withdrawalId}</p>
                <p><strong>Utilisateur:</strong> ${user.email}</p>
                <p><strong>Montant:</strong> ${totalPending.toFixed(2)}€</p>
              `,
            }],
          }),
        });
      } catch (emailError) {
        this.logger.warn('Withdrawal notification email failed', { error: emailError });
      }
    }

    this.logger.log('Withdrawal requested', {
      withdrawalId,
      userId,
      amount: totalPending,
    });

    return {
      withdrawalId,
      amount: totalPending,
      status: 'pending',
      message: 'Demande de retrait enregistrée. Paiement sous 3-5 jours ouvrés.',
    };
  }
}
