export interface ProductionOptions {
  materials?: string[];
  finishes?: string[];
  specialInstructions?: string[];
  specialRequirements?: string[];
  qualityLevel?: 'standard' | 'premium' | 'luxury';
  packaging?: string;
  rush?: boolean;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface ProductionJobData {
  orderId: string;
  brandId: string;
  designId: string;
  productId: string;
  quantity: number;
  options: ProductionOptions;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  factoryWebhookUrl?: string;
  shippingAddress: Address;
  billingAddress: Address;
}

export interface ProductionTrackingPayload {
  orderId: string;
  factoryId: string;
}

export type ProductionJobPayload =
  | ProductionJobData
  | ProductionTrackingPayload;

