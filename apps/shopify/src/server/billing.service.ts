import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BillingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    ai_generations: number;
    ar_views: number;
    widget_embeds: number;
    storage_gb: number;
  };
}

export interface Subscription {
  id: string;
  shop: string;
  plan_id: string;
  status: 'active' | 'pending' | 'cancelled' | 'expired';
  current_period_start: Date;
  current_period_end: Date;
  trial_end: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Usage {
  shop: string;
  period: string;
  ai_generations: number;
  ar_views: number;
  widget_embeds: number;
  storage_used_gb: number;
  total_cost: number;
  created_at: Date;
  updated_at: Date;
}

export interface Invoice {
  id: string;
  shop: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  due_date: Date;
  paid_at: Date | null;
  created_at: Date;
}

export interface Charge {
  id: string;
  shop: string;
  name: string;
  price: number;
  currency: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  return_url: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly configService: ConfigService) {}

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return 'Erreur inconnue';
    }
  }

  /**
   * Obtenir la liste des plans de facturation
   */
  async getBillingPlans(): Promise<BillingPlan[]> {
    try {
      // Plans de facturation Luneo
      const plans: BillingPlan[] = [
        {
          id: 'starter',
          name: 'Starter',
          description: 'Parfait pour débuter avec Luneo',
          price: 29,
          currency: 'EUR',
          interval: 'month',
          features: [
            'Génération IA illimitée',
            'Visualiseur AR',
            'Widget embed',
            'Support email',
          ],
          limits: {
            ai_generations: 1000,
            ar_views: 5000,
            widget_embeds: 10,
            storage_gb: 5,
          },
        },
        {
          id: 'pro',
          name: 'Pro',
          description: 'Pour les entreprises en croissance',
          price: 99,
          currency: 'EUR',
          interval: 'month',
          features: [
            'Génération IA illimitée',
            'Visualiseur AR avancé',
            'Widget embed personnalisé',
            'Support prioritaire',
            'Analytics avancées',
            'Intégrations API',
          ],
          limits: {
            ai_generations: 10000,
            ar_views: 50000,
            widget_embeds: 100,
            storage_gb: 50,
          },
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          description: 'Solution complète pour les grandes entreprises',
          price: 299,
          currency: 'EUR',
          interval: 'month',
          features: [
            'Génération IA illimitée',
            'Visualiseur AR personnalisé',
            'Widget embed blanc',
            'Support dédié 24/7',
            'Analytics personnalisées',
            'Intégrations personnalisées',
            'SLA garanti',
            'Formation équipe',
          ],
          limits: {
            ai_generations: -1, // Illimité
            ar_views: -1, // Illimité
            widget_embeds: -1, // Illimité
            storage_gb: 500,
          },
        },
      ];

      return plans;
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des plans:', error);
      throw new Error(`Impossible de récupérer les plans: ${this.extractErrorMessage(error)}`);
    }
  }

  /**
   * Obtenir l'abonnement du shop
   */
  async getSubscription(shop: string): Promise<Subscription | null> {
    try {
      // TODO: Récupérer l'abonnement depuis la base de données
      // Pour l'instant, retourner un abonnement factice
      
      this.logger.log(`Récupération de l'abonnement pour le shop: ${shop}`);
      
      return {
        id: `sub_${shop}_${Date.now()}`,
        shop,
        plan_id: 'starter',
        status: 'active',
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        trial_end: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de l\'abonnement:', error);
      throw new Error(`Impossible de récupérer l'abonnement: ${this.extractErrorMessage(error)}`);
    }
  }

  /**
   * Créer un nouvel abonnement
   */
  async createSubscription(shop: string, subscriptionData: {
    plan_id: string;
    trial_days?: number;
  }): Promise<Subscription> {
    try {
      this.logger.log(`Création d'un abonnement pour le shop: ${shop}`);
      
      const { plan_id, trial_days = 14 } = subscriptionData;
      
      // Vérifier que le plan existe
      const plans = await this.getBillingPlans();
      const plan = plans.find(p => p.id === plan_id);
      
      if (!plan) {
        throw new Error('Plan non trouvé');
      }

      // Créer l'abonnement
      const subscription: Subscription = {
        id: `sub_${shop}_${Date.now()}`,
        shop,
        plan_id,
        status: 'pending',
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        trial_end: trial_days > 0 ? new Date(Date.now() + trial_days * 24 * 60 * 60 * 1000) : null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // TODO: Sauvegarder l'abonnement en base de données
      
      // Créer une charge Shopify si nécessaire
      if (plan.price > 0) {
        await this.createCharge(shop, {
          name: `Luneo ${plan.name} - ${plan.interval}`,
          price: plan.price,
          currency: plan.currency,
          return_url: `${this.configService.get('shopify.appUrl')}/billing/success`,
        });
      }

      this.logger.log(`Abonnement créé avec succès pour le shop: ${shop}`);
      
      return subscription;
    } catch (error) {
      this.logger.error('Erreur lors de la création de l\'abonnement:', error);
      throw new Error(`Impossible de créer l'abonnement: ${this.extractErrorMessage(error)}`);
    }
  }

  /**
   * Mettre à jour l'abonnement
   */
  async updateSubscription(shop: string, subscriptionData: Partial<Subscription>): Promise<Subscription> {
    try {
      this.logger.log(`Mise à jour de l'abonnement pour le shop: ${shop}`);
      
      const existingSubscription = await this.getSubscription(shop);
      
      if (!existingSubscription) {
        throw new Error('Abonnement non trouvé');
      }

      const updatedSubscription: Subscription = {
        ...existingSubscription,
        ...subscriptionData,
        updated_at: new Date(),
      };

      // TODO: Mettre à jour l'abonnement en base de données
      
      this.logger.log(`Abonnement mis à jour avec succès pour le shop: ${shop}`);
      
      return updatedSubscription;
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour de l\'abonnement:', error);
      throw new Error(`Impossible de mettre à jour l'abonnement: ${this.extractErrorMessage(error)}`);
    }
  }

  /**
   * Annuler l'abonnement
   */
  async cancelSubscription(shop: string): Promise<void> {
    try {
      this.logger.log(`Annulation de l'abonnement pour le shop: ${shop}`);
      
      const subscription = await this.getSubscription(shop);
      
      if (!subscription) {
        throw new Error('Abonnement non trouvé');
      }

      // Marquer l'abonnement comme annulé
      await this.updateSubscription(shop, {
        status: 'cancelled',
      });

      // TODO: Notifier Luneo de l'annulation
      
      this.logger.log(`Abonnement annulé avec succès pour le shop: ${shop}`);
    } catch (error) {
      this.logger.error('Erreur lors de l\'annulation de l\'abonnement:', error);
      throw new Error(`Impossible d'annuler l'abonnement: ${this.extractErrorMessage(error)}`);
    }
  }

  /**
   * Enregistrer l'utilisation du service
   */
  async recordUsage(shop: string, usageData: {
    ai_generations?: number;
    ar_views?: number;
    widget_embeds?: number;
    storage_used_gb?: number;
  }): Promise<Usage> {
    try {
      this.logger.log(`Enregistrement de l'utilisation pour le shop: ${shop}`);
      
      const { ai_generations = 0, ar_views = 0, widget_embeds = 0, storage_used_gb = 0 } = usageData;
      
      // Calculer le coût basé sur l'utilisation
      const subscription = await this.getSubscription(shop);
      const plan = subscription ? (await this.getBillingPlans()).find(p => p.id === subscription.plan_id) : null;
      
      let total_cost = 0;
      if (plan) {
        // Calculer les coûts supplémentaires si les limites sont dépassées
        if (plan.limits.ai_generations !== -1 && ai_generations > plan.limits.ai_generations) {
          total_cost += (ai_generations - plan.limits.ai_generations) * 0.01; // 0.01€ par génération
        }
        if (plan.limits.storage_gb !== -1 && storage_used_gb > plan.limits.storage_gb) {
          total_cost += (storage_used_gb - plan.limits.storage_gb) * 2; // 2€ par GB supplémentaire
        }
      }

      const usage: Usage = {
        shop,
        period: new Date().toISOString().slice(0, 7), // YYYY-MM
        ai_generations,
        ar_views,
        widget_embeds,
        storage_used_gb,
        total_cost,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // TODO: Sauvegarder l'utilisation en base de données
      
      this.logger.log(`Utilisation enregistrée avec succès pour le shop: ${shop}`);
      
      return usage;
    } catch (error) {
      this.logger.error('Erreur lors de l\'enregistrement de l\'utilisation:', error);
      throw new Error(`Impossible d'enregistrer l'utilisation: ${this.extractErrorMessage(error)}`);
    }
  }

  /**
   * Obtenir l'utilisation du service
   */
  async getUsage(shop: string, period: string): Promise<Usage[]> {
    try {
      this.logger.log(`Récupération de l'utilisation pour le shop: ${shop}, période: ${period}`);
      
      // TODO: Récupérer l'utilisation depuis la base de données
      // Pour l'instant, retourner une utilisation factice
      
      return [
        {
          shop,
          period: new Date().toISOString().slice(0, 7),
          ai_generations: 150,
          ar_views: 1200,
          widget_embeds: 5,
          storage_used_gb: 2.5,
          total_cost: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de l\'utilisation:', error);
      throw new Error(`Impossible de récupérer l'utilisation: ${this.extractErrorMessage(error)}`);
    }
  }

  /**
   * Obtenir la liste des factures
   */
  async getInvoices(shop: string, limit: number = 10): Promise<Invoice[]> {
    try {
      this.logger.log(`Récupération des factures pour le shop: ${shop}`);
      
      // TODO: Récupérer les factures depuis la base de données
      // Pour l'instant, retourner des factures factices
      
      const invoices: Invoice[] = [
        {
          id: `inv_${shop}_${Date.now()}`,
          shop,
          amount: 29,
          currency: 'EUR',
          status: 'paid',
          due_date: new Date(),
          paid_at: new Date(),
          created_at: new Date(),
        },
      ];

      return invoices.slice(0, limit);
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des factures:', error);
      throw new Error(`Impossible de récupérer les factures: ${this.extractErrorMessage(error)}`);
    }
  }

  /**
   * Obtenir une facture spécifique
   */
  async getInvoice(shop: string, invoiceId: string): Promise<Invoice | null> {
    try {
      this.logger.log(`Récupération de la facture ${invoiceId} pour le shop: ${shop}`);
      
      // TODO: Récupérer la facture depuis la base de données
      
      return {
        id: invoiceId,
        shop,
        amount: 29,
        currency: 'EUR',
        status: 'paid',
        due_date: new Date(),
        paid_at: new Date(),
        created_at: new Date(),
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de la facture:', error);
      throw new Error(`Impossible de récupérer la facture: ${this.extractErrorMessage(error)}`);
    }
  }

  /**
   * Créer une charge Shopify
   */
  async createCharge(shop: string, chargeData: {
    name: string;
    price: number;
    currency: string;
    return_url: string;
  }): Promise<Charge> {
    try {
      this.logger.log(`Création d'une charge pour le shop: ${shop}`);
      
      const { name, price, currency, return_url } = chargeData;
      
      // TODO: Créer la charge via l'API Shopify
      // Pour l'instant, retourner une charge factice
      
      const charge: Charge = {
        id: `charge_${shop}_${Date.now()}`,
        shop,
        name,
        price,
        currency,
        status: 'pending',
        return_url,
        created_at: new Date(),
        updated_at: new Date(),
      };

      this.logger.log(`Charge créée avec succès pour le shop: ${shop}`);
      
      return charge;
    } catch (error) {
      this.logger.error('Erreur lors de la création de la charge:', error);
      throw new Error(`Impossible de créer la charge: ${this.extractErrorMessage(error)}`);
    }
  }

  /**
   * Obtenir une charge spécifique
   */
  async getCharge(shop: string, chargeId: string): Promise<Charge | null> {
    try {
      this.logger.log(`Récupération de la charge ${chargeId} pour le shop: ${shop}`);
      
      // TODO: Récupérer la charge depuis l'API Shopify
      
      return {
        id: chargeId,
        shop,
        name: 'Luneo Starter',
        price: 29,
        currency: 'EUR',
        status: 'accepted',
        return_url: `${this.configService.get('shopify.appUrl')}/billing/success`,
        created_at: new Date(),
        updated_at: new Date(),
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de la charge:', error);
      throw new Error(`Impossible de récupérer la charge: ${this.extractErrorMessage(error)}`);
    }
  }

  /**
   * Gérer les webhooks de facturation Shopify
   */
  async handleBillingWebhook(shop: string, topic: string, data: Record<string, unknown>): Promise<void> {
    try {
      this.logger.log(`Traitement du webhook de facturation ${topic} pour le shop: ${shop}`);
      
      switch (topic) {
        case 'app_subscriptions/create':
          await this.handleSubscriptionCreated(shop, data);
          break;
        case 'app_subscriptions/update':
          await this.handleSubscriptionUpdated(shop, data);
          break;
        case 'app_subscriptions/cancelled':
          await this.handleSubscriptionCancelled(shop, data);
          break;
        case 'app_subscriptions/expired':
          await this.handleSubscriptionExpired(shop, data);
          break;
        case 'app_subscriptions/frozen':
          await this.handleSubscriptionFrozen(shop, data);
          break;
        case 'app_subscriptions/unfrozen':
          await this.handleSubscriptionUnfrozen(shop, data);
          break;
        default:
          this.logger.warn(`Topic de webhook non géré: ${topic}`);
      }
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook de facturation:', error);
      throw error;
    }
  }

  private async handleSubscriptionCreated(shop: string, _data: Record<string, unknown>): Promise<void> {
    this.logger.log(`Abonnement créé pour le shop: ${shop}`);
    // TODO: Traiter la création d'abonnement
  }

  private async handleSubscriptionUpdated(shop: string, _data: Record<string, unknown>): Promise<void> {
    this.logger.log(`Abonnement mis à jour pour le shop: ${shop}`);
    // TODO: Traiter la mise à jour d'abonnement
  }

  private async handleSubscriptionCancelled(shop: string, _data: Record<string, unknown>): Promise<void> {
    this.logger.log(`Abonnement annulé pour le shop: ${shop}`);
    // TODO: Traiter l'annulation d'abonnement
  }

  private async handleSubscriptionExpired(shop: string, _data: Record<string, unknown>): Promise<void> {
    this.logger.log(`Abonnement expiré pour le shop: ${shop}`);
    // TODO: Traiter l'expiration d'abonnement
  }

  private async handleSubscriptionFrozen(shop: string, _data: Record<string, unknown>): Promise<void> {
    this.logger.log(`Abonnement gelé pour le shop: ${shop}`);
    // TODO: Traiter le gel d'abonnement
  }

  private async handleSubscriptionUnfrozen(shop: string, _data: Record<string, unknown>): Promise<void> {
    this.logger.log(`Abonnement dégelé pour le shop: ${shop}`);
    // TODO: Traiter le dégel d'abonnement
  }
}



