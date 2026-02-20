import { Injectable, Logger } from '@nestjs/common';

interface TaxCalculation {
  amountHt: number;
  vatRate: number;
  vatAmount: number;
  amountTtc: number;
  reverseCharge: boolean;
  taxNote: string;
}

interface TaxInput {
  amountTtcOrHt: number;
  clientCountry: string;
  clientType: 'B2B' | 'B2C';
  clientVatNumber?: string | null;
}

const EU_VAT_RATES: Record<string, number> = {
  AT: 20, BE: 21, BG: 20, HR: 25, CY: 19, CZ: 21,
  DK: 25, EE: 22, FI: 24, FR: 20, DE: 19, GR: 24,
  HU: 27, IE: 23, IT: 22, LV: 21, LT: 21, LU: 17,
  MT: 18, NL: 21, PL: 23, PT: 23, RO: 19, SK: 20,
  SI: 22, ES: 21, SE: 25,
};

const EU_COUNTRIES = new Set(Object.keys(EU_VAT_RATES));

const CH_VAT_RATE = 8.1;

@Injectable()
export class InvoiceTaxService {
  private readonly logger = new Logger(InvoiceTaxService.name);

  /**
   * Calculate tax for an invoice.
   *
   * Rules (Luneo Tech Sarl, based in Switzerland):
   * - B2B EU with valid VAT number: 0% reverse charge
   * - B2C EU: VAT of client's country
   * - Switzerland: CH VAT 8.1% (if applicable; currently below CHF 100k threshold)
   * - Rest of world: 0%
   */
  calculateTax(input: TaxInput): TaxCalculation {
    const { amountTtcOrHt, clientCountry, clientType, clientVatNumber } = input;
    const country = clientCountry.toUpperCase();

    // Switzerland
    if (country === 'CH') {
      // Currently below CHF 100k threshold, no VAT charged.
      // When threshold is exceeded, apply CH_VAT_RATE.
      return {
        amountHt: amountTtcOrHt,
        vatRate: 0,
        vatAmount: 0,
        amountTtc: amountTtcOrHt,
        reverseCharge: false,
        taxNote: 'Exonéré TVA suisse (art. 10 al. 2 let. a LTVA — CA < CHF 100\'000)',
      };
    }

    // EU B2B with valid VAT number → Reverse charge
    if (EU_COUNTRIES.has(country) && clientType === 'B2B' && clientVatNumber) {
      return {
        amountHt: amountTtcOrHt,
        vatRate: 0,
        vatAmount: 0,
        amountTtc: amountTtcOrHt,
        reverseCharge: true,
        taxNote: `Autoliquidation de la TVA (art. 196 Directive 2006/112/CE) — N° TVA: ${clientVatNumber}`,
      };
    }

    // EU B2C → VAT of client's country
    if (EU_COUNTRIES.has(country) && clientType === 'B2C') {
      const rate = EU_VAT_RATES[country] || 20;
      const vatAmount = Math.round(amountTtcOrHt * (rate / 100) * 100) / 100;
      return {
        amountHt: amountTtcOrHt,
        vatRate: rate,
        vatAmount,
        amountTtc: Math.round((amountTtcOrHt + vatAmount) * 100) / 100,
        reverseCharge: false,
        taxNote: `TVA ${rate}% (${country})`,
      };
    }

    // EU B2B without VAT number → treat as B2C
    if (EU_COUNTRIES.has(country) && clientType === 'B2B' && !clientVatNumber) {
      const rate = EU_VAT_RATES[country] || 20;
      const vatAmount = Math.round(amountTtcOrHt * (rate / 100) * 100) / 100;
      this.logger.warn(`B2B client in ${country} without VAT number — applying local VAT`);
      return {
        amountHt: amountTtcOrHt,
        vatRate: rate,
        vatAmount,
        amountTtc: Math.round((amountTtcOrHt + vatAmount) * 100) / 100,
        reverseCharge: false,
        taxNote: `TVA ${rate}% (${country}) — N° TVA non fourni`,
      };
    }

    // Rest of world → 0%
    return {
      amountHt: amountTtcOrHt,
      vatRate: 0,
      vatAmount: 0,
      amountTtc: amountTtcOrHt,
      reverseCharge: false,
      taxNote: 'Hors champ TVA — prestation hors UE/Suisse',
    };
  }

  isEuCountry(country: string): boolean {
    return EU_COUNTRIES.has(country.toUpperCase());
  }

  getEuVatRate(country: string): number {
    return EU_VAT_RATES[country.toUpperCase()] || 0;
  }

  getSwissVatRate(): number {
    return CH_VAT_RATE;
  }

  /**
   * Generate sequential invoice number: INV-YYYY-XXXX
   */
  generateInvoiceNumber(year: number, sequence: number): string {
    return `INV-${year}-${String(sequence).padStart(4, '0')}`;
  }
}
