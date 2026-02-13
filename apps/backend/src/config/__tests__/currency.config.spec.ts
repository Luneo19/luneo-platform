import { detectCurrency } from '../currency.config';

describe('currency.config', () => {
  describe('detectCurrency', () => {
    it("should return 'chf' for country CH", () => {
      expect(detectCurrency('CH')).toBe('chf');
    });

    it("should return 'eur' for country DE", () => {
      expect(detectCurrency('DE')).toBe('eur');
    });

    it("should return 'eur' for country FR", () => {
      expect(detectCurrency('FR')).toBe('eur');
    });

    it("should return 'usd' for country US", () => {
      expect(detectCurrency('US')).toBe('usd');
    });

    it("should return 'usd' when country/locale undefined", () => {
      expect(detectCurrency(undefined)).toBe('usd');
    });

    it("should return 'chf' for locale fr-CH (Switzerland)", () => {
      expect(detectCurrency(undefined, 'fr-CH')).toBe('chf');
    });

    it("should return 'eur' for locale de-DE (Germany)", () => {
      expect(detectCurrency(undefined, 'de-DE')).toBe('eur');
    });

    it('should be case-insensitive', () => {
      expect(detectCurrency('ch')).toBe('chf');
      expect(detectCurrency('de')).toBe('eur');
    });
  });
});
