/**
 * ★★★ SHIPPING CALCULATOR ★★★
 * Calculateur de frais de livraison
 * - Basé sur l'adresse
 * - Basé sur le poids/dimensions
 * - Support multi-transporteurs
 */

import { logger } from '@/lib/logger';

export interface ShippingAddress {
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
}

export interface ShippingOptions {
  weight?: number; // en kg
  dimensions?: {
    length: number; // en cm
    width: number;
    height: number;
  };
  carrier?: 'standard' | 'express' | 'priority';
}

/**
 * Calcule les frais de livraison
 */
export function calculateShipping(
  address: ShippingAddress,
  options: ShippingOptions = {}
): number {
  try {
    const { country, state: _state, postalCode: _postalCode } = address;
    const { weight = 0.5, dimensions, carrier = 'standard' } = options;

    // Base shipping rates by country (in EUR)
    const baseRates: Record<string, number> = {
      FR: 5.0, // France
      BE: 6.0, // Belgique
      DE: 7.0, // Allemagne
      ES: 8.0, // Espagne
      IT: 8.0, // Italie
      UK: 10.0, // Royaume-Uni
      US: 15.0, // États-Unis
      CA: 18.0, // Canada
      AU: 25.0, // Australie
    };

    // Base rate
    let shippingCost = baseRates[country] || 15.0; // Default international

    // Weight-based adjustment (€0.50 per 100g over 500g)
    if (weight > 0.5) {
      const extraWeight = weight - 0.5;
      shippingCost += Math.ceil(extraWeight * 10) * 0.5; // €0.50 per 100g
    }

    // Dimensions-based adjustment (if provided)
    if (dimensions) {
      const volume = (dimensions.length * dimensions.width * dimensions.height) / 1000; // en litres
      if (volume > 1) {
        // Volume-based surcharge for large items
        shippingCost += Math.ceil(volume - 1) * 2.0; // €2 per liter over 1L
      }
    }

    // Carrier multiplier
    const carrierMultipliers: Record<string, number> = {
      standard: 1.0,
      express: 1.5,
      priority: 2.0,
    };

    shippingCost *= carrierMultipliers[carrier] || 1.0;

    // Free shipping for France over €50 (example)
    if (country === 'FR' && shippingCost > 0) {
      // This would be checked against order total in the actual implementation
    }

    logger.info('Shipping calculated', {
      country,
      weight,
      carrier,
      shippingCost,
    });

    return Math.round(shippingCost * 100) / 100; // Round to 2 decimals
  } catch (error: unknown) {
    logger.error('Error calculating shipping', { error, address, options });
    // Return default shipping cost on error
    return 10.0;
  }
}

/**
 * Obtient les options de livraison disponibles
 */
export function getAvailableShippingOptions(
  address: ShippingAddress
): Array<{ carrier: string; cost: number; estimatedDays: number }> {
  const standard = calculateShipping(address, { carrier: 'standard' });
  const express = calculateShipping(address, { carrier: 'express' });
  const priority = calculateShipping(address, { carrier: 'priority' });

  return [
    {
      carrier: 'standard',
      cost: standard,
      estimatedDays: getEstimatedDays(address.country, 'standard'),
    },
    {
      carrier: 'express',
      cost: express,
      estimatedDays: getEstimatedDays(address.country, 'express'),
    },
    {
      carrier: 'priority',
      cost: priority,
      estimatedDays: getEstimatedDays(address.country, 'priority'),
    },
  ];
}

/**
 * Obtient le nombre de jours estimés de livraison
 */
function getEstimatedDays(country: string, carrier: string): number {
  const baseDays: Record<string, { standard: number; express: number; priority: number }> = {
    FR: { standard: 3, express: 1, priority: 1 },
    BE: { standard: 4, express: 2, priority: 1 },
    DE: { standard: 5, express: 2, priority: 1 },
    ES: { standard: 6, express: 3, priority: 2 },
    IT: { standard: 6, express: 3, priority: 2 },
    UK: { standard: 7, express: 3, priority: 2 },
    US: { standard: 14, express: 7, priority: 3 },
    CA: { standard: 15, express: 8, priority: 4 },
    AU: { standard: 20, express: 10, priority: 5 },
  };

  const countryDays = baseDays[country] || { standard: 10, express: 5, priority: 3 };
  return countryDays[carrier as keyof typeof countryDays] || countryDays.standard;
}

