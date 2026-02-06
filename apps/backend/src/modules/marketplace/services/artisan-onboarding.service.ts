import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AppErrorFactory, ErrorCode } from '@/common/errors/app-error';
import type Stripe from 'stripe';

export interface ArtisanOnboardingRequest {
  userId: string;
  businessName: string;
  legalName?: string;
  taxId?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  supportedMaterials: string[];
  supportedTechniques: string[];
  maxVolume?: number;
  averageLeadTime?: number;
  minOrderValue?: number;
}

export interface KYCDocument {
  type: 'identity' | 'business_license' | 'tax_certificate' | 'bank_statement';
  url: string;
  verified: boolean;
}

@Injectable()
export class ArtisanOnboardingService {
  private readonly logger = new Logger(ArtisanOnboardingService.name);
  private stripeInstance: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Lazy load Stripe
   */
  private async getStripe(): Promise<Stripe> {
    if (!this.stripeInstance) {
      const stripeModule = await import('stripe');
      this.stripeInstance = new stripeModule.default(
        this.configService.get<string>('stripe.secretKey')!,
        { apiVersion: '2023-10-16' },
      );
    }
    return this.stripeInstance;
  }

  /**
   * Crée un artisan et démarre l'onboarding
   */
  async createArtisan(request: ArtisanOnboardingRequest) {
    // Vérifier que l'utilisateur existe et a le rôle FABRICATOR
    const user = await this.prisma.user.findUnique({
      where: { id: request.userId },
      select: {
        id: true,
        email: true,
        role: true,
        brandId: true,
      },
    });

    if (!user) {
      throw AppErrorFactory.notFound('User', request.userId, { operation: 'createArtisan' });
    }

    // Vérifier qu'il n'y a pas déjà un artisan pour cet utilisateur
    const existing = await this.prisma.artisan.findUnique({
      where: { userId: request.userId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (existing) {
      throw AppErrorFactory.conflict('Artisan already exists for this user', {
        userId: request.userId,
        existingArtisanId: existing.id,
      });
    }

    // Créer l'artisan
    const artisan = await this.prisma.artisan.create({
      data: {
        userId: request.userId,
        businessName: request.businessName,
        legalName: request.legalName,
        taxId: request.taxId,
        address: request.address as any,
        phone: request.phone,
        email: request.email,
        website: request.website,
        supportedMaterials: request.supportedMaterials,
        supportedTechniques: request.supportedTechniques,
        maxVolume: request.maxVolume || 10,
        averageLeadTime: request.averageLeadTime || 7,
        minOrderValue: request.minOrderValue || 0,
        kycStatus: 'PENDING',
        status: 'inactive', // Inactif jusqu'à vérification KYC
      },
    });

    // Créer le compte Stripe Connect
    const stripeAccount = await this.createStripeConnectAccount(artisan.id, request);

    // Mettre à jour avec Stripe account ID
    await this.prisma.artisan.update({
      where: { id: artisan.id },
      data: {
        stripeAccountId: stripeAccount.id,
        stripeAccountStatus: stripeAccount.details_submitted ? 'active' : 'pending',
      },
    });

    this.logger.log(`Artisan ${artisan.id} created, Stripe Connect account: ${stripeAccount.id}`);

    return {
      artisan,
      stripeAccountId: stripeAccount.id,
      onboardingUrl: stripeAccount.onboardingUrl,
    };
  }

  /**
   * Crée un compte Stripe Connect
   */
  private async createStripeConnectAccount(
    artisanId: string,
    request: ArtisanOnboardingRequest,
  ): Promise<{ id: string; onboardingUrl: string; details_submitted: boolean }> {
    const stripe = await this.getStripe();

    // Créer le compte Connect
    const account = await stripe.accounts.create({
      type: 'express',
      country: request.address?.country || 'FR',
      email: request.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        artisanId,
        businessName: request.businessName,
      },
    });

    // Créer le lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${this.configService.get('app.url')}/artisan/onboarding/refresh`,
      return_url: `${this.configService.get('app.url')}/artisan/onboarding/complete`,
      type: 'account_onboarding',
    });

    return {
      id: account.id,
      onboardingUrl: accountLink.url,
      details_submitted: account.details_submitted,
    };
  }

  /**
   * Soumet des documents KYC
   */
  async submitKYCDocuments(artisanId: string, documents: KYCDocument[]) {
    const artisan = await this.prisma.artisan.findUnique({
      where: { id: artisanId },
    });

    if (!artisan) {
      throw AppErrorFactory.notFound('Artisan', artisanId);
    }

    // Sauvegarder les documents
    const kycDocuments = (artisan.kycDocuments as any) || [];
    kycDocuments.push(...documents);

    await this.prisma.artisan.update({
      where: { id: artisanId },
      data: {
        kycDocuments: kycDocuments as any,
        kycStatus: 'PENDING', // En attente de vérification
      },
    });

    // Intégration service de vérification KYC
    // Note: Pour une implémentation complète, intégrer Onfido, Jumio, ou un service similaire
    // Pour l'instant, marquer comme "pending" et notifier les admins pour vérification manuelle
    
    this.logger.log(`Documents KYC soumis pour artisan ${artisanId}`, {
      documentCount: documents.length,
      documentTypes: documents.map(d => d.type),
    });

    // TODO: Intégrer service de vérification KYC automatique (ex: Onfido, Jumio)
    // Exemple d'intégration future:
    // const kycResult = await this.kycService.verifyDocuments(documents);
    // await this.prisma.artisan.update({
    //   where: { id: artisanId },
    //   data: {
    //     kycStatus: kycResult.verified ? 'verified' : 'rejected',
    //     kycVerifiedAt: kycResult.verified ? new Date() : null,
    //     status: kycResult.verified ? 'active' : 'suspended',
    //   },
    // });

    return { status: 'pending', message: 'Documents submitted, verification in progress' };
  }

  /**
   * Vérifie manuellement un artisan (admin)
   */
  async verifyArtisan(artisanId: string, verified: boolean, reason?: string) {
    const artisan = await this.prisma.artisan.findUnique({
      where: { id: artisanId },
    });

    if (!artisan) {
      throw AppErrorFactory.notFound('Artisan', artisanId);
    }

    await this.prisma.artisan.update({
      where: { id: artisanId },
      data: {
        kycStatus: verified ? 'VERIFIED' : 'REJECTED',
        kycVerifiedAt: verified ? new Date() : null,
        status: verified ? 'active' : 'suspended',
      },
    });

    this.logger.log(`Artisan ${artisanId} ${verified ? 'verified' : 'rejected'}: ${reason}`);

    return { verified, reason };
  }

  /**
   * Ajoute une capacité (matériau/technique)
   */
  async addCapability(
    artisanId: string,
    material: string,
    technique: string,
    options?: {
      maxSize?: number;
      minSize?: number;
      leadTime?: number;
      costMultiplier?: number;
    },
  ) {
    const artisan = await this.prisma.artisan.findUnique({
      where: { id: artisanId },
    });

    if (!artisan) {
      throw AppErrorFactory.notFound('Artisan', artisanId);
    }

    const capability = await this.prisma.artisanCapability.create({
      data: {
        artisanId,
        material,
        technique,
        maxSize: options?.maxSize,
        minSize: options?.minSize,
        leadTime: options?.leadTime,
        costMultiplier: options?.costMultiplier || 1.0,
      },
    });

    return capability;
  }

  /**
   * Met à jour les capacités d'un artisan
   */
  async updateCapabilities(artisanId: string, capabilities: Array<{
    material: string;
    technique: string;
    maxSize?: number;
    minSize?: number;
    leadTime?: number;
    costMultiplier?: number;
  }>) {
    // Supprimer les anciennes capacités
    await this.prisma.artisanCapability.deleteMany({
      where: { artisanId },
    });

    // Créer les nouvelles
    await this.prisma.artisanCapability.createMany({
      data: capabilities.map((cap) => ({
        artisanId,
        ...cap,
      })),
    });

    return { updated: capabilities.length };
  }
}



















