'use client';

/**
 * Checkout Page
 * - Cart summary
 * - Shipping address form
 * - Shipping method selection
 * - Stripe payment redirect
 */

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  Lock,
  Package,
  Truck,
  Zap,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';
import { useI18n } from '@/i18n/useI18n';

// ========================================
// TYPES
// ========================================

interface ShippingAddress {
  name: string;
  email: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

const SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard', description: '5-7 jours ouvrés', priceCents: 500, icon: Package },
  { id: 'express', label: 'Express', description: '2-3 jours ouvrés', priceCents: 1500, icon: Truck },
  { id: 'overnight', label: 'Nuit', description: 'Livraison le lendemain', priceCents: 3000, icon: Zap },
];

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

// ========================================
// CHECKOUT PAGE
// ========================================

export default function CheckoutPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { items, getSubtotalCents, getTaxCents, clearCart, brandId } = useCartStore();

  const [address, setAddress] = useState<ShippingAddress>({
    name: '',
    email: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'FR',
  });
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedShipping = SHIPPING_METHODS.find((m) => m.id === shippingMethod)!;
  const subtotal = getSubtotalCents();
  const tax = getTaxCents();
  const shipping = selectedShipping.priceCents;
  const total = subtotal + tax + shipping;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!address.name || !address.email || !address.street || !address.city || !address.postalCode) {
        setError(t('common.fillRequired'));
        return;
      }

      if (items.length === 0) {
        setError(t('checkout.emptyCart'));
        return;
      }

      setIsSubmitting(true);

      try {
        // Create order via backend API -> get Stripe checkout URL
        const order = await endpoints.orders.create({
          items: items.map((item) => ({
            product_id: item.productId,
            design_id: item.designId || undefined,
            quantity: item.quantity,
            customization: item.customizationId || undefined,
            production_notes: '',
            metadata: {
              ...item.metadata,
              productName: item.productName,
              productImage: item.productImage,
            },
          })),
          shippingAddress: {
            name: address.name,
            street: address.street,
            city: address.city,
            postalCode: address.postalCode,
            country: address.country,
            phone: address.phone,
          },
          shippingMethod,
          customerEmail: address.email,
          customerName: address.name,
          customerNotes: '',
        }) as { id?: string; checkoutUrl?: string; paymentUrl?: string; error?: string; message?: string };

        // Redirect to Stripe Checkout
        if (order.checkoutUrl || order.paymentUrl) {
          clearCart();
          window.location.href = (order.checkoutUrl || order.paymentUrl) ?? '';
        } else {
          // If no Stripe URL, redirect to order confirmation
          clearCart();
          router.push(`/checkout/success?orderId=${order.id}`);
        }

        logger.info('Order created from checkout', { orderId: order.id });
      } catch (err: unknown) {
        let message = t('checkout.paymentError');
        if (err && typeof err === 'object' && 'response' in err) {
          const res = (err as { response?: { data?: { error?: string; message?: string } } }).response;
          const data = res?.data;
          if (data?.error) message = data.error;
          else if (data?.message) message = data.message;
        } else if (err instanceof Error) {
          message = err.message;
        } else {
          message = String(err);
        }
        setError(message);
        logger.error('Checkout error', { error: err });
      } finally {
        setIsSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, address, shippingMethod, clearCart, router, brandId, t]
  );

  if (items.length === 0) {
    return (
      <div className="container max-w-2xl mx-auto py-16 px-4 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
        <h1 className="text-2xl font-bold mb-2">{t('checkout.emptyCart')}</h1>
        <p className="text-muted-foreground mb-6">{t('checkout.addProducts')}</p>
        <Link href="/">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          {t('checkout.continueShopping')}
        </Link>
        <h1 className="text-3xl font-bold mt-4">{t('checkout.title')}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('checkout.shippingAddress')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('common.fullName')} *</Label>
                  <Input
                    id="name"
                    value={address.name}
                    onChange={(e) => setAddress({ ...address, name: e.target.value })}
                    placeholder="Jean Dupont"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('common.email')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                    placeholder="jean.dupont@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">{t('common.address')} *</Label>
                  <Input
                    id="street"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    placeholder="123 Rue de la Paix"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('common.city')} *</Label>
                    <Input
                      id="city"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      placeholder="Paris"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">{t('common.postalCode')} *</Label>
                    <Input
                      id="postalCode"
                      value={address.postalCode}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      placeholder="75001"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('common.phone')}</Label>
                  <Input
                    id="phone"
                    value={address.phone || ''}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('checkout.shippingMethod')}</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="space-y-3">
                  {SHIPPING_METHODS.map((method) => (
                    <div
                      key={method.id}
                      className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                        shippingMethod === method.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setShippingMethod(method.id)}
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <method.icon className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <Label htmlFor={method.id} className="cursor-pointer font-medium">
                          {method.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                      <span className="font-medium">{formatPrice(method.priceCents)}</span>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Right: Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">{t('checkout.summary')}</CardTitle>
                <CardDescription>{items.length} {t('checkout.articles', { count: items.length })}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                {items.map((item, idx) => (
                  <div
                    key={`${item.productId}-${idx}`}
                    className="flex justify-between text-sm"
                  >
                    <span className="truncate mr-2">
                      {item.productName} x{item.quantity}
                    </span>
                    <span className="font-medium flex-shrink-0">
                      {formatPrice(item.totalCents)}
                    </span>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('checkout.subtotal')}</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('checkout.shipping')} ({selectedShipping.label})</span>
                    <span>{formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('checkout.tax')}</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>{t('checkout.total')}</span>
                  <span>{formatPrice(total)}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('checkout.processing')}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      {t('checkout.pay')} {formatPrice(total)}
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" />
                  {t('checkout.securePayment')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
