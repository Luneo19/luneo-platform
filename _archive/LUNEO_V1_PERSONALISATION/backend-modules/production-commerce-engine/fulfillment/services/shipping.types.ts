/**
 * Shared types for shipping: used by ShippingService and provider implementations.
 */

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface Package {
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export interface ShippingRate {
  id: string;
  carrier: string;
  serviceLevel?: string;
  priceCents: number;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  currency?: string;
}

export interface GetRatesParams {
  origin: Address;
  destination: Address;
  packages: Package[];
  carrier?: string;
}

export interface CreateShipmentParams {
  rateId: string;
  origin: Address;
  destination: Address;
  packages: Package[];
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateShipmentResult {
  shipmentId: string;
  trackingNumber: string;
  trackingUrl?: string;
  labelUrl?: string;
}

export interface ValidateAddressResult {
  valid: boolean;
  normalized?: Address;
  suggestions?: Address[];
}

export const SHIPPING_PROVIDER_REGISTRY = Symbol('SHIPPING_PROVIDER_REGISTRY');

/**
 * Interface that carrier-specific providers must implement.
 * Providers are selected by carrier name in ShippingService.
 */
export interface IShippingProvider {
  readonly carrier: string;

  getRates(params: GetRatesParams): Promise<ShippingRate[]>;

  createShipment(params: CreateShipmentParams): Promise<CreateShipmentResult>;

  getLabel(shipmentId: string): Promise<{ labelUrl: string; format?: string }>;

  cancelShipment(shipmentId: string): Promise<void>;

  validateAddress(address: Address): Promise<ValidateAddressResult>;
}
