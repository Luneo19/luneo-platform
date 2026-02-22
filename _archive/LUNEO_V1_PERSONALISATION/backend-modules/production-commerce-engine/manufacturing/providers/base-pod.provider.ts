import { Logger } from '@nestjs/common';
import type {
  PODShippingAddress,
  PODOrderItem,
  PODCreateOrderResult,
  PODOrderStatusResult,
  PODShippingRate,
  PODProduct,
} from '../interfaces/manufacturing.interface';

/**
 * Configuration passed when instantiating a provider (e.g. from DB credentials).
 */
export interface BasePODProviderConfig {
  providerId: string;
  credentials: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

/**
 * Abstract base class defining the contract for POD (Print-on-Demand) providers.
 * Concrete implementations: Printful, Gelato, Printify, etc.
 */
export abstract class BasePODProvider {
  protected readonly logger: Logger;
  protected readonly providerId: string;
  protected readonly credentials: Record<string, unknown>;
  protected readonly settings: Record<string, unknown>;

  constructor(config: BasePODProviderConfig) {
    this.providerId = config.providerId;
    this.credentials = config.credentials;
    this.settings = config.settings ?? {};
    this.logger = new Logger(this.constructor.name);
  }

  /** Establish connection / validate credentials with the provider API. */
  abstract connect(): Promise<void>;

  /** Fetch product catalog (or relevant subset). */
  abstract getProducts(): Promise<PODProduct[]>;

  /** Get shipping rates for the given address and items. */
  abstract getShippingRates(
    address: PODShippingAddress,
    items: PODOrderItem[],
  ): Promise<PODShippingRate[]>;

  /** Create an order with the provider; returns external order id and status. */
  abstract createOrder(
    items: PODOrderItem[],
    address: PODShippingAddress,
    metadata?: Record<string, unknown>,
  ): Promise<PODCreateOrderResult>;

  /** Get current status of an order by external ID. */
  abstract getOrderStatus(externalOrderId: string): Promise<PODOrderStatusResult>;

  /** Cancel an order by external ID (if supported). */
  abstract cancelOrder(externalOrderId: string): Promise<{ cancelled: boolean; message?: string }>;

  /** Verify webhook signature/payload from the provider. */
  abstract verifyWebhook(payload: unknown, signature?: string): boolean;

  /** Human-readable provider name. */
  abstract get name(): string;

  /** Provider type slug (e.g. 'printful', 'gelato'). */
  abstract get slug(): string;
}
