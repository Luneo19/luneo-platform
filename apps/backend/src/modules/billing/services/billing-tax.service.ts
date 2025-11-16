import { Injectable } from '@nestjs/common';

export interface TaxComputationInput {
  subtotalCents: number;
  countryCode: string;
  regionCode?: string | null;
  isDigitalProduct?: boolean;
}

export interface TaxComputationResult {
  subtotalCents: number;
  taxRate: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  jurisdiction: string;
}

type TaxRateKey = `${string}-${string}`;

@Injectable()
export class BillingTaxService {
  private readonly defaultCurrency = 'EUR';

  private readonly vatMap: Record<TaxRateKey | string, number> = {
    // Union européenne – TVA standard
    'EU-FR': 0.20,
    'EU-DE': 0.19,
    'EU-ES': 0.21,
    'EU-IT': 0.22,
    'EU-NL': 0.21,
    'EU-IE': 0.23,
    // Amérique du Nord
    'US-CA': 0.085, // Californie (moyenne)
    'US-NY': 0.08875,
    'US-TX': 0.0825,
    US: 0.0, // Pas de TVA fédérale, attention aux états
    CA: 0.13, // HST Ontario
    // APAC
    AU: 0.10,
    NZ: 0.15,
    SG: 0.08,
    JP: 0.10,
    // par défaut hors UE : 0 (géré ailleurs)
  };

  computeTax(input: TaxComputationInput): TaxComputationResult {
    const rate = this.resolveRate(input.countryCode, input.regionCode, input.isDigitalProduct);
    const taxCents = Math.round(input.subtotalCents * rate);

    return {
      subtotalCents: input.subtotalCents,
      taxRate: rate,
      taxCents,
      totalCents: input.subtotalCents + taxCents,
      currency: this.resolveCurrency(input.countryCode),
      jurisdiction: this.resolveJurisdiction(input.countryCode, input.regionCode),
    };
  }

  resolveRate(countryCode: string, regionCode?: string | null, isDigitalProduct = true): number {
    const normalizedCountry = countryCode?.toUpperCase();
    const normalizedRegion = regionCode?.toUpperCase();

    if (!normalizedCountry) {
      return 0;
    }

    const euCountries = [
      'FR',
      'DE',
      'NL',
      'ES',
      'IT',
      'IE',
      'BE',
      'LU',
      'PT',
      'AT',
      'FI',
      'SE',
      'DK',
      'PL',
      'CZ',
      'SK',
      'HU',
      'SI',
      'HR',
      'EE',
      'LV',
      'LT',
      'RO',
      'BG',
      'GR',
      'CY',
      'MT',
    ];

    if (euCountries.includes(normalizedCountry)) {
      const key: TaxRateKey = `EU-${normalizedCountry}`;
      return this.vatMap[key] ?? 0.20;
    }

    if (normalizedCountry === 'US' && normalizedRegion) {
      const key: TaxRateKey = `US-${normalizedRegion}`;
      return this.vatMap[key] ?? this.vatMap.US ?? 0;
    }

    if (normalizedCountry === 'US') {
      return this.vatMap.US ?? 0;
    }

    return this.vatMap[normalizedCountry] ?? (isDigitalProduct ? 0.15 : 0);
  }

  resolveCurrency(countryCode: string): string {
    const eurZone = [
      'FR',
      'DE',
      'ES',
      'IT',
      'IE',
      'NL',
      'PT',
      'BE',
      'FI',
      'AT',
      'LU',
      'GR',
      'CY',
      'EE',
      'LV',
      'LT',
      'SK',
      'SI',
      'MT',
    ];

    if (eurZone.includes(countryCode.toUpperCase())) {
      return 'EUR';
    }

    const currencyMap: Record<string, string> = {
      US: 'USD',
      CA: 'CAD',
      GB: 'GBP',
      AU: 'AUD',
      NZ: 'NZD',
      SG: 'SGD',
      JP: 'JPY',
      CH: 'CHF',
    };

    return currencyMap[countryCode.toUpperCase()] ?? this.defaultCurrency;
  }

  resolveJurisdiction(countryCode: string, regionCode?: string | null): string {
    const upperCountry = countryCode.toUpperCase();
    const upperRegion = regionCode?.toUpperCase();

    if (upperRegion) {
      return `${upperCountry}-${upperRegion}`;
    }

    return upperCountry;
  }
}

