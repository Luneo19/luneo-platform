import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async createCheckoutSession(planId: string, userId: string, userEmail: string) {
    const planPrices = {
      starter: null, // Gratuit
      professional: this.configService.get('STRIPE_PRICE_PRO'),
      business: this.configService.get('STRIPE_PRICE_BUSINESS'),
      enterprise: this.configService.get('STRIPE_PRICE_ENTERPRISE')
    };

    const priceId = planPrices[planId];
    
    if (!priceId) {
      throw new Error(`Plan ${planId} not found`);
    }

    // Tous les plans sont maintenant configurés dans Stripe

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        customer_email: userEmail,
        success_url: `${this.configService.get('STRIPE_SUCCESS_URL')}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get('STRIPE_CANCEL_URL')}`,
        metadata: {
          userId,
          planId,
        },
        // Essai gratuit de 14 jours
        subscription_data: {
          trial_period_days: 14,
        },
      });

      return {
        success: true,
        url: session.url,
      };
    } catch (error) {
      console.error('Erreur création session Stripe:', error);
      throw new Error('Erreur lors de la création de la session de paiement');
    }
  }

  async createCustomerPortalSession(userId: string) {
    try {
      // Ici vous devriez récupérer le customer_id depuis votre base de données
      // Pour l'instant, on utilise un placeholder
      const customerId = `cus_${userId}`;
      
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${this.configService.get('FRONTEND_URL')}/dashboard/billing`,
      });

      return {
        success: true,
        url: session.url,
      };
    } catch (error) {
      console.error('Erreur création session portal:', error);
      throw new Error('Erreur lors de la création de la session du portail client');
    }
  }
}
