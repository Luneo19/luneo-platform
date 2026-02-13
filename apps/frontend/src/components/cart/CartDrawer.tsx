'use client';

/**
 * Cart Drawer - Slide-out cart panel
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart.store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isOpen,
    setOpen,
    removeItem,
    updateQuantity,
    getSubtotalCents,
    getTaxCents,
    getTotalCents,
    getItemCount,
  } = useCartStore();

  const handleCheckout = () => {
    setOpen(false);
    router.push('/checkout');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="flex flex-col w-full sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Panier
            {getItemCount() > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getItemCount()}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Votre panier est vide</p>
              <p className="text-sm mt-1">Ajoutez des produits personnalisés</p>
            </div>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item, idx) => (
                <div key={`${item.productId}-${item.designId}-${item.customizationId}-${idx}`} className="flex gap-3">
                  {/* Product image */}
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">{formatPrice(item.priceCents)}</p>

                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1, item.designId, item.customizationId)
                        }
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1, item.designId, item.customizationId)
                        }
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-auto text-destructive"
                        onClick={() => removeItem(item.productId, item.designId, item.customizationId)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Line total */}
                  <div className="text-sm font-medium text-right">
                    {formatPrice(item.totalCents)}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Summary */}
            <div className="py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{formatPrice(getSubtotalCents())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVA (20%)</span>
                <span>{formatPrice(getTaxCents())}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(getTotalCents())}</span>
              </div>
            </div>

            <SheetFooter>
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Passer à la caisse
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Cart icon button for header/navbar
 */
export function CartButton() {
  const { toggleOpen, getItemCount } = useCartStore();
  const count = getItemCount();

  return (
    <Button variant="ghost" size="icon" className="relative" onClick={toggleOpen}>
      <ShoppingBag className="w-5 h-5" />
      {count > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </Button>
  );
}
