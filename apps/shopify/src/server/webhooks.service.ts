import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Gérer la désinstallation de l'application
   */
  async handleAppUninstalled(shopDomain: string, data: any): Promise<void> {
    try {
      this.logger.log(`Traitement de la désinstallation pour le shop: ${shopDomain}`);
      
      // Nettoyer les données du shop
      await this.cleanupShopData(shopDomain);
      
      // Notifier Luneo de la désinstallation
      await this.notifyLuneoUninstall(shopDomain);
      
      this.logger.log(`Désinstallation traitée avec succès pour: ${shopDomain}`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de la désinstallation:', error);
      throw error;
    }
  }

  /**
   * Gérer la création de commande
   */
  async handleOrderCreated(shopDomain: string, orderData: any): Promise<void> {
    try {
      this.logger.log(`Traitement de la création de commande pour le shop: ${shopDomain}`);
      
      const order = orderData;
      
      // Analyser les produits de la commande pour l'IA
      await this.analyzeOrderForAI(shopDomain, order);
      
      // Synchroniser avec Luneo
      await this.syncOrderWithLuneo(shopDomain, order);
      
      this.logger.log(`Commande ${order.id} traitée avec succès`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de la création de commande:', error);
      throw error;
    }
  }

  /**
   * Gérer la mise à jour de commande
   */
  async handleOrderUpdated(shopDomain: string, orderData: any): Promise<void> {
    try {
      this.logger.log(`Traitement de la mise à jour de commande pour le shop: ${shopDomain}`);
      
      const order = orderData;
      
      // Mettre à jour la commande dans Luneo
      await this.updateOrderInLuneo(shopDomain, order);
      
      this.logger.log(`Commande ${order.id} mise à jour avec succès`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de la mise à jour de commande:', error);
      throw error;
    }
  }

  /**
   * Gérer le paiement de commande
   */
  async handleOrderPaid(shopDomain: string, orderData: any): Promise<void> {
    try {
      this.logger.log(`Traitement du paiement de commande pour le shop: ${shopDomain}`);
      
      const order = orderData;
      
      // Déclencher les processus post-paiement
      await this.processPostPayment(shopDomain, order);
      
      // Notifier Luneo du paiement
      await this.notifyLuneoPayment(shopDomain, order);
      
      this.logger.log(`Paiement de la commande ${order.id} traité avec succès`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement du paiement:', error);
      throw error;
    }
  }

  /**
   * Gérer l'annulation de commande
   */
  async handleOrderCancelled(shopDomain: string, orderData: any): Promise<void> {
    try {
      this.logger.log(`Traitement de l'annulation de commande pour le shop: ${shopDomain}`);
      
      const order = orderData;
      
      // Annuler les processus en cours
      await this.cancelOrderProcesses(shopDomain, order);
      
      // Notifier Luneo de l'annulation
      await this.notifyLuneoCancellation(shopDomain, order);
      
      this.logger.log(`Annulation de la commande ${order.id} traitée avec succès`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de l\'annulation:', error);
      throw error;
    }
  }

  /**
   * Gérer la livraison de commande
   */
  async handleOrderFulfilled(shopDomain: string, orderData: any): Promise<void> {
    try {
      this.logger.log(`Traitement de la livraison de commande pour le shop: ${shopDomain}`);
      
      const order = orderData;
      
      // Finaliser les processus
      await this.finalizeOrderProcesses(shopDomain, order);
      
      // Notifier Luneo de la livraison
      await this.notifyLuneoFulfillment(shopDomain, order);
      
      this.logger.log(`Livraison de la commande ${order.id} traitée avec succès`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de la livraison:', error);
      throw error;
    }
  }

  /**
   * Gérer la création de produit
   */
  async handleProductCreated(shopDomain: string, productData: any): Promise<void> {
    try {
      this.logger.log(`Traitement de la création de produit pour le shop: ${shopDomain}`);
      
      const product = productData;
      
      // Analyser le produit pour l'IA
      await this.analyzeProductForAI(shopDomain, product);
      
      // Synchroniser avec Luneo
      await this.syncProductWithLuneo(shopDomain, product);
      
      this.logger.log(`Produit ${product.id} créé avec succès`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de la création de produit:', error);
      throw error;
    }
  }

  /**
   * Gérer la mise à jour de produit
   */
  async handleProductUpdated(shopDomain: string, productData: any): Promise<void> {
    try {
      this.logger.log(`Traitement de la mise à jour de produit pour le shop: ${shopDomain}`);
      
      const product = productData;
      
      // Mettre à jour le produit dans Luneo
      await this.updateProductInLuneo(shopDomain, product);
      
      this.logger.log(`Produit ${product.id} mis à jour avec succès`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de la mise à jour de produit:', error);
      throw error;
    }
  }

  /**
   * Gérer la suppression de produit
   */
  async handleProductDeleted(shopDomain: string, productData: any): Promise<void> {
    try {
      this.logger.log(`Traitement de la suppression de produit pour le shop: ${shopDomain}`);
      
      const product = productData;
      
      // Supprimer le produit de Luneo
      await this.deleteProductFromLuneo(shopDomain, product);
      
      this.logger.log(`Produit ${product.id} supprimé avec succès`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de la suppression de produit:', error);
      throw error;
    }
  }

  /**
   * Gérer la création de client
   */
  async handleCustomerCreated(shopDomain: string, customerData: any): Promise<void> {
    try {
      this.logger.log(`Traitement de la création de client pour le shop: ${shopDomain}`);
      
      const customer = customerData;
      
      // Synchroniser le client avec Luneo
      await this.syncCustomerWithLuneo(shopDomain, customer);
      
      this.logger.log(`Client ${customer.id} créé avec succès`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de la création de client:', error);
      throw error;
    }
  }

  /**
   * Gérer la mise à jour de client
   */
  async handleCustomerUpdated(shopDomain: string, customerData: any): Promise<void> {
    try {
      this.logger.log(`Traitement de la mise à jour de client pour le shop: ${shopDomain}`);
      
      const customer = customerData;
      
      // Mettre à jour le client dans Luneo
      await this.updateCustomerInLuneo(shopDomain, customer);
      
      this.logger.log(`Client ${customer.id} mis à jour avec succès`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de la mise à jour de client:', error);
      throw error;
    }
  }

  /**
   * Gérer la suppression de client
   */
  async handleCustomerDeleted(shopDomain: string, customerData: any): Promise<void> {
    try {
      this.logger.log(`Traitement de la suppression de client pour le shop: ${shopDomain}`);
      
      const customer = customerData;
      
      // Supprimer le client de Luneo
      await this.deleteCustomerFromLuneo(shopDomain, customer);
      
      this.logger.log(`Client ${customer.id} supprimé avec succès`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de la suppression de client:', error);
      throw error;
    }
  }

  /**
   * Gérer la mise à jour des niveaux de stock
   */
  async handleInventoryLevelsUpdated(shopDomain: string, inventoryData: any): Promise<void> {
    try {
      this.logger.log(`Traitement de la mise à jour des niveaux de stock pour le shop: ${shopDomain}`);
      
      const inventory = inventoryData;
      
      // Mettre à jour les niveaux de stock dans Luneo
      await this.updateInventoryLevelsInLuneo(shopDomain, inventory);
      
      this.logger.log(`Niveaux de stock mis à jour avec succès`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de la mise à jour des niveaux de stock:', error);
      throw error;
    }
  }

  // Méthodes privées pour l'intégration avec Luneo

  private async cleanupShopData(shopDomain: string): Promise<void> {
    try {
      // TODO: Implémenter le nettoyage des données
      this.logger.log(`Nettoyage des données pour le shop: ${shopDomain}`);
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage des données:', error);
    }
  }

  private async notifyLuneoUninstall(shopDomain: string): Promise<void> {
    try {
      const luneoApiUrl = this.configService.get('luneo.apiUrl');
      const luneoApiKey = this.configService.get('luneo.apiKey');
      
      if (luneoApiUrl && luneoApiKey) {
        await axios.post(`${luneoApiUrl}/integrations/shopify/uninstall`, {
          shop_domain: shopDomain,
          uninstalled_at: new Date().toISOString(),
        }, {
          headers: {
            'Authorization': `Bearer ${luneoApiKey}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la notification à Luneo:', error);
    }
  }

  private async analyzeOrderForAI(shopDomain: string, order: any): Promise<void> {
    try {
      // Analyser les produits de la commande pour l'IA
      const products = order.line_items || [];
      
      for (const item of products) {
        // TODO: Implémenter l'analyse IA des produits
        this.logger.log(`Analyse IA du produit ${item.product_id} pour la commande ${order.id}`);
      }
    } catch (error) {
      this.logger.error('Erreur lors de l\'analyse IA de la commande:', error);
    }
  }

  private async syncOrderWithLuneo(shopDomain: string, order: any): Promise<void> {
    try {
      const luneoApiUrl = this.configService.get('luneo.apiUrl');
      const luneoApiKey = this.configService.get('luneo.apiKey');
      
      if (luneoApiUrl && luneoApiKey) {
        await axios.post(`${luneoApiUrl}/integrations/shopify/orders`, {
          shop_domain: shopDomain,
          order: {
            id: order.id,
            name: order.name,
            email: order.email,
            total_price: order.total_price,
            currency: order.currency,
            line_items: order.line_items,
            customer: order.customer,
            created_at: order.created_at,
            updated_at: order.updated_at,
          },
        }, {
          headers: {
            'Authorization': `Bearer ${luneoApiKey}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation de la commande avec Luneo:', error);
    }
  }

  private async updateOrderInLuneo(shopDomain: string, order: any): Promise<void> {
    try {
      const luneoApiUrl = this.configService.get('luneo.apiUrl');
      const luneoApiKey = this.configService.get('luneo.apiKey');
      
      if (luneoApiUrl && luneoApiKey) {
        await axios.put(`${luneoApiUrl}/integrations/shopify/orders/${order.id}`, {
          shop_domain: shopDomain,
          order: order,
        }, {
          headers: {
            'Authorization': `Bearer ${luneoApiKey}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour de la commande dans Luneo:', error);
    }
  }

  private async processPostPayment(shopDomain: string, order: any): Promise<void> {
    try {
      // TODO: Implémenter les processus post-paiement
      this.logger.log(`Traitement post-paiement pour la commande ${order.id}`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement post-paiement:', error);
    }
  }

  private async notifyLuneoPayment(shopDomain: string, order: any): Promise<void> {
    try {
      const luneoApiUrl = this.configService.get('luneo.apiUrl');
      const luneoApiKey = this.configService.get('luneo.apiKey');
      
      if (luneoApiUrl && luneoApiKey) {
        await axios.post(`${luneoApiUrl}/integrations/shopify/payments`, {
          shop_domain: shopDomain,
          order_id: order.id,
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        }, {
          headers: {
            'Authorization': `Bearer ${luneoApiKey}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la notification de paiement à Luneo:', error);
    }
  }

  private async cancelOrderProcesses(shopDomain: string, order: any): Promise<void> {
    try {
      // TODO: Implémenter l'annulation des processus
      this.logger.log(`Annulation des processus pour la commande ${order.id}`);
    } catch (error) {
      this.logger.error('Erreur lors de l\'annulation des processus:', error);
    }
  }

  private async notifyLuneoCancellation(shopDomain: string, order: any): Promise<void> {
    try {
      const luneoApiUrl = this.configService.get('luneo.apiUrl');
      const luneoApiKey = this.configService.get('luneo.apiKey');
      
      if (luneoApiUrl && luneoApiKey) {
        await axios.post(`${luneoApiUrl}/integrations/shopify/cancellations`, {
          shop_domain: shopDomain,
          order_id: order.id,
          cancelled_at: new Date().toISOString(),
        }, {
          headers: {
            'Authorization': `Bearer ${luneoApiKey}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la notification d\'annulation à Luneo:', error);
    }
  }

  private async finalizeOrderProcesses(shopDomain: string, order: any): Promise<void> {
    try {
      // TODO: Implémenter la finalisation des processus
      this.logger.log(`Finalisation des processus pour la commande ${order.id}`);
    } catch (error) {
      this.logger.error('Erreur lors de la finalisation des processus:', error);
    }
  }

  private async notifyLuneoFulfillment(shopDomain: string, order: any): Promise<void> {
    try {
      const luneoApiUrl = this.configService.get('luneo.apiUrl');
      const luneoApiKey = this.configService.get('luneo.apiKey');
      
      if (luneoApiUrl && luneoApiKey) {
        await axios.post(`${luneoApiUrl}/integrations/shopify/fulfillments`, {
          shop_domain: shopDomain,
          order_id: order.id,
          fulfilled_at: new Date().toISOString(),
        }, {
          headers: {
            'Authorization': `Bearer ${luneoApiKey}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la notification de livraison à Luneo:', error);
    }
  }

  private async analyzeProductForAI(shopDomain: string, product: any): Promise<void> {
    try {
      // TODO: Implémenter l'analyse IA du produit
      this.logger.log(`Analyse IA du produit ${product.id}`);
    } catch (error) {
      this.logger.error('Erreur lors de l\'analyse IA du produit:', error);
    }
  }

  private async syncProductWithLuneo(shopDomain: string, product: any): Promise<void> {
    try {
      const luneoApiUrl = this.configService.get('luneo.apiUrl');
      const luneoApiKey = this.configService.get('luneo.apiKey');
      
      if (luneoApiUrl && luneoApiKey) {
        await axios.post(`${luneoApiUrl}/integrations/shopify/products`, {
          shop_domain: shopDomain,
          product: {
            id: product.id,
            title: product.title,
            vendor: product.vendor,
            product_type: product.product_type,
            tags: product.tags,
            status: product.status,
            variants: product.variants,
            images: product.images,
          },
        }, {
          headers: {
            'Authorization': `Bearer ${luneoApiKey}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation du produit avec Luneo:', error);
    }
  }

  private async updateProductInLuneo(shopDomain: string, product: any): Promise<void> {
    try {
      const luneoApiUrl = this.configService.get('luneo.apiUrl');
      const luneoApiKey = this.configService.get('luneo.apiKey');
      
      if (luneoApiUrl && luneoApiKey) {
        await axios.put(`${luneoApiUrl}/integrations/shopify/products/${product.id}`, {
          shop_domain: shopDomain,
          product: product,
        }, {
          headers: {
            'Authorization': `Bearer ${luneoApiKey}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour du produit dans Luneo:', error);
    }
  }

  private async deleteProductFromLuneo(shopDomain: string, product: any): Promise<void> {
    try {
      const luneoApiUrl = this.configService.get('luneo.apiUrl');
      const luneoApiKey = this.configService.get('luneo.apiKey');
      
      if (luneoApiUrl && luneoApiKey) {
        await axios.delete(`${luneoApiUrl}/integrations/shopify/products/${product.id}`, {
          headers: {
            'Authorization': `Bearer ${luneoApiKey}`,
          },
          data: {
            shop_domain: shopDomain,
          },
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la suppression du produit de Luneo:', error);
    }
  }

  private async syncCustomerWithLuneo(shopDomain: string, customer: any): Promise<void> {
    try {
      const luneoApiUrl = this.configService.get('luneo.apiUrl');
      const luneoApiKey = this.configService.get('luneo.apiKey');
      
      if (luneoApiUrl && luneoApiKey) {
        await axios.post(`${luneoApiUrl}/integrations/shopify/customers`, {
          shop_domain: shopDomain,
          customer: {
            id: customer.id,
            email: customer.email,
            first_name: customer.first_name,
            last_name: customer.last_name,
            phone: customer.phone,
            created_at: customer.created_at,
            updated_at: customer.updated_at,
          },
        }, {
          headers: {
            'Authorization': `Bearer ${luneoApiKey}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation du client avec Luneo:', error);
    }
  }

  private async updateCustomerInLuneo(shopDomain: string, customer: any): Promise<void> {
    try {
      const luneoApiUrl = this.configService.get('luneo.apiUrl');
      const luneoApiKey = this.configService.get('luneo.apiKey');
      
      if (luneoApiUrl && luneoApiKey) {
        await axios.put(`${luneoApiUrl}/integrations/shopify/customers/${customer.id}`, {
          shop_domain: shopDomain,
          customer: customer,
        }, {
          headers: {
            'Authorization': `Bearer ${luneoApiKey}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour du client dans Luneo:', error);
    }
  }

  private async deleteCustomerFromLuneo(shopDomain: string, customer: any): Promise<void> {
    try {
      const luneoApiUrl = this.configService.get('luneo.apiUrl');
      const luneoApiKey = this.configService.get('luneo.apiKey');
      
      if (luneoApiUrl && luneoApiKey) {
        await axios.delete(`${luneoApiUrl}/integrations/shopify/customers/${customer.id}`, {
          headers: {
            'Authorization': `Bearer ${luneoApiKey}`,
          },
          data: {
            shop_domain: shopDomain,
          },
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la suppression du client de Luneo:', error);
    }
  }

  private async updateInventoryLevelsInLuneo(shopDomain: string, inventory: any): Promise<void> {
    try {
      const luneoApiUrl = this.configService.get('luneo.apiUrl');
      const luneoApiKey = this.configService.get('luneo.apiKey');
      
      if (luneoApiUrl && luneoApiKey) {
        await axios.post(`${luneoApiUrl}/integrations/shopify/inventory`, {
          shop_domain: shopDomain,
          inventory: inventory,
        }, {
          headers: {
            'Authorization': `Bearer ${luneoApiKey}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour des niveaux de stock dans Luneo:', error);
    }
  }
}



