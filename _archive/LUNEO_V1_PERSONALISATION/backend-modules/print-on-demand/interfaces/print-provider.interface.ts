export interface PrintProduct {
  id: string;
  name: string;
  category: string; // 't-shirt', 'mug', 'poster', 'hoodie', 'phone-case', etc.
  variants: PrintVariant[];
  mockupUrl?: string;
}

export interface PrintVariant {
  id: string;
  size?: string;
  color?: string;
  price: number; // Provider cost in cents
  currency: string;
}

export interface PrintOrderRequest {
  externalId: string; // Our order ID
  items: PrintOrderItem[];
  shippingAddress: ShippingAddress;
}

export interface PrintOrderItem {
  productId: string;
  variantId: string;
  quantity: number;
  designUrl: string; // URL to the design file
}

export interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  country: string;
  zip: string;
}

export interface PrintOrderResult {
  providerId: string;
  providerOrderId: string;
  status: string;
  estimatedDelivery?: Date;
  trackingUrl?: string;
}

export interface PrintProvider {
  name: string;
  getProducts(): Promise<PrintProduct[]>;
  getProductById(id: string): Promise<PrintProduct | null>;
  createOrder(order: PrintOrderRequest): Promise<PrintOrderResult>;
  getOrderStatus(providerOrderId: string): Promise<PrintOrderResult>;
  cancelOrder(providerOrderId: string): Promise<boolean>;
  getMockup(productId: string, designUrl: string): Promise<string>; // Returns mockup image URL
}
