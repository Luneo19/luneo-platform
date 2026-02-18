'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { useToast } from '@/hooks/use-toast';
import { CurrencyFormatter } from '@/lib/configurator-3d/pricing/CurrencyFormatter';
import { cn } from '@/lib/utils';

export interface AddToCartButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showPrice?: boolean;
}

export function AddToCartButton({
  className,
  variant = 'default',
  size = 'lg',
  showPrice = true,
}: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const addToCart = useConfigurator3DStore((s) => s.addToCart);
  const validation = useConfigurator3DStore((s) => s.validation);
  const price = useConfigurator3DStore((s) => s.price);
  const currency =
    useConfigurator3DStore(
      (s) => s.configuration?.pricingSettings?.currency
    ) ?? 'EUR';

  const handleClick = async () => {
    if (!validation.valid) {
      toast({
        title: 'Configuration incomplete',
        description: validation.errors[0]?.message ?? 'Please complete all required selections.',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);
    setSuccess(false);
    try {
      const result = await addToCart();
      if (result.success) {
        setSuccess(true);
        toast({
          title: 'Added to cart',
          description: 'Your configuration has been added to your cart.',
        });
        setTimeout(() => setSuccess(false), 2000);
      } else {
        toast({
          title: 'Failed to add to cart',
          description: result.error ?? 'Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('relative overflow-hidden', className)}
      onClick={handleClick}
      disabled={isAdding || !validation.valid}
    >
      {isAdding ? (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Adding...
        </motion.span>
      ) : success ? (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          Added!
        </motion.span>
      ) : (
        <span className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
          {showPrice && (
            <span className="ml-1 font-semibold">
              {CurrencyFormatter.format(price, currency)}
            </span>
          )}
        </span>
      )}
    </Button>
  );
}
