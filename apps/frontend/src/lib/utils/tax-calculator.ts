/**
 * ★★★ TAX CALCULATOR ★★★
 * Calculateur de taxes
 * - Basé sur le pays
 * - Support TVA/VAT/GST
 * - Calculs précis par région
 */

import { logger } from '@/lib/logger';

export interface TaxAddress {
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
}

/**
 * Calcule les taxes basées sur le pays
 */
export function calculateTax(
  subtotal: number,
  address: TaxAddress
): number {
  try {
    const { country, state } = address;

    // Tax rates by country (VAT/TVA/GST)
    const taxRates: Record<string, number> = {
      // Europe
      FR: 0.20, // 20% TVA France
      BE: 0.21, // 21% TVA Belgique
      DE: 0.19, // 19% TVA Allemagne
      ES: 0.21, // 21% TVA Espagne
      IT: 0.22, // 22% TVA Italie
      NL: 0.21, // 21% TVA Pays-Bas
      AT: 0.20, // 20% TVA Autriche
      PT: 0.23, // 23% TVA Portugal
      UK: 0.20, // 20% VAT UK
      IE: 0.23, // 23% VAT Ireland
      // Amérique du Nord
      US: getUSTaxRate(state), // Variable par état
      CA: getCanadaTaxRate(state), // Variable par province
      MX: 0.16, // 16% IVA Mexique
      // Asie
      JP: 0.10, // 10% Consumption Tax Japon
      CN: 0.13, // 13% VAT Chine
      IN: 0.18, // 18% GST Inde
      SG: 0.09, // 9% GST Singapour
      // Océanie
      AU: 0.10, // 10% GST Australie
      NZ: 0.15, // 15% GST Nouvelle-Zélande
      // Autres
      CH: 0.077, // 7.7% TVA Suisse
      NO: 0.25, // 25% VAT Norvège
      SE: 0.25, // 25% VAT Suède
      DK: 0.25, // 25% VAT Danemark
    };

    const taxRate = taxRates[country] || 0.20; // Default 20%
    const tax = subtotal * taxRate;

    logger.info('Tax calculated', {
      country,
      state,
      subtotal,
      taxRate: taxRate * 100 + '%',
      tax,
    });

    return Math.round(tax * 100) / 100; // Round to 2 decimals
  } catch (error: unknown) {
    logger.error('Error calculating tax', { error, address, subtotal });
    // Return default tax on error (20%)
    return Math.round(subtotal * 0.20 * 100) / 100;
  }
}

/**
 * Obtient le taux de taxe US par état
 */
function getUSTaxRate(state?: string): number {
  if (!state) return 0; // No state = no tax (B2B or tax-exempt)

  // US Sales Tax rates by state (simplified - actual rates vary by city/county)
  const stateRates: Record<string, number> = {
    CA: 0.0725, // California ~7.25%
    NY: 0.08, // New York ~8%
    TX: 0.0625, // Texas ~6.25%
    FL: 0.06, // Florida ~6%
    IL: 0.0625, // Illinois ~6.25%
    PA: 0.06, // Pennsylvania ~6%
    OH: 0.0575, // Ohio ~5.75%
    GA: 0.04, // Georgia ~4%
    NC: 0.0475, // North Carolina ~4.75%
    MI: 0.06, // Michigan ~6%
    // States with no sales tax
    AK: 0,
    DE: 0,
    MT: 0,
    NH: 0,
    OR: 0,
  };

  return stateRates[state.toUpperCase()] || 0.05; // Default 5%
}

/**
 * Obtient le taux de taxe canadien par province
 */
function getCanadaTaxRate(province?: string): number {
  if (!province) return 0.13; // Default GST + HST

  // Canada: GST (5%) + Provincial tax
  const provinceRates: Record<string, number> = {
    ON: 0.13, // Ontario: HST 13%
    QC: 0.14975, // Quebec: GST 5% + QST 9.975%
    BC: 0.12, // British Columbia: GST 5% + PST 7%
    AB: 0.05, // Alberta: GST 5% only
    MB: 0.12, // Manitoba: GST 5% + PST 7%
    SK: 0.11, // Saskatchewan: GST 5% + PST 6%
    NS: 0.15, // Nova Scotia: HST 15%
    NB: 0.15, // New Brunswick: HST 15%
    NL: 0.15, // Newfoundland: HST 15%
    PE: 0.15, // Prince Edward Island: HST 15%
    NT: 0.05, // Northwest Territories: GST 5%
    YT: 0.05, // Yukon: GST 5%
    NU: 0.05, // Nunavut: GST 5%
  };

  return provinceRates[province.toUpperCase()] || 0.13; // Default 13%
}

/**
 * Vérifie si une adresse est éligible à l'exemption de taxe (B2B)
 */
export function isTaxExempt(address: TaxAddress, vatNumber?: string): boolean {
  // B2B transactions within EU with valid VAT number are tax-exempt
  const euCountries = [
    'FR', 'BE', 'DE', 'ES', 'IT', 'NL', 'AT', 'PT', 'IE', 'FI', 'GR', 'LU',
    'DK', 'SE', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'EE', 'LV', 'LT', 'MT', 'CY',
  ];

  if (euCountries.includes(address.country) && vatNumber) {
    // In production, validate VAT number with VIES (EU VAT Information Exchange System)
    return true;
  }

  return false;
}

