import { BillingTaxService } from './billing-tax.service';

describe('BillingTaxService', () => {
  let service: BillingTaxService;

  beforeEach(() => {
    service = new BillingTaxService();
  });

  it('calcule la TVA française par défaut', () => {
    const result = service.computeTax({
      subtotalCents: 10000,
      countryCode: 'FR',
    });

    expect(result.taxRate).toBeCloseTo(0.2);
    expect(result.taxCents).toBe(2000);
    expect(result.totalCents).toBe(12000);
    expect(result.currency).toBe('EUR');
  });

  it('gère un état américain spécifique', () => {
    const result = service.computeTax({
      subtotalCents: 10000,
      countryCode: 'US',
      regionCode: 'CA',
    });

    expect(result.taxRate).toBeCloseTo(0.085);
  });

  it('retourne 0 si pays inconnu pour produit physique', () => {
    const result = service.computeTax({
      subtotalCents: 10000,
      countryCode: 'BR',
      isDigitalProduct: false,
    });

    expect(result.taxRate).toBe(0);
  });
});

