/**
 * CurrencyFormatter tests
 * Format EUR, USD, GBP, CHF; compact format; symbol extraction.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CurrencyFormatter } from '@/lib/configurator-3d/pricing/CurrencyFormatter';

describe('CurrencyFormatter', () => {
  const originalLanguage = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

  afterEach(() => {
    if (typeof navigator !== 'undefined' && 'language' in navigator) {
      Object.defineProperty(navigator, 'language', { value: originalLanguage, configurable: true });
    }
  });

  it('format EUR with default locale', () => {
    const formatted = CurrencyFormatter.format(99.99, 'EUR');
    expect(formatted).toMatch(/99[,.]99/);
    expect(formatted).toMatch(/€|EUR/);
  });

  it('format USD', () => {
    const formatted = CurrencyFormatter.format(1234.56, 'USD');
    expect(formatted).toMatch(/1[,.]?234[,.]?56/);
    expect(formatted).toMatch(/\$|USD/);
  });

  it('format GBP', () => {
    const formatted = CurrencyFormatter.format(50, 'GBP');
    expect(formatted).toMatch(/50/);
    expect(formatted).toMatch(/£|GBP/);
  });

  it('format CHF', () => {
    const formatted = CurrencyFormatter.format(100, 'CHF');
    expect(formatted).toMatch(/100/);
    expect(formatted).toMatch(/CHF|Fr/);
  });

  it('compact format: 1.2K for thousands', () => {
    const formatted = CurrencyFormatter.formatCompact(1200, 'EUR');
    expect(formatted).toMatch(/1[.,]2K|1.2K/);
  });

  it('compact format: M for millions', () => {
    const formatted = CurrencyFormatter.formatCompact(2_500_000, 'USD');
    expect(formatted).toMatch(/2[.,]5M|2.5M/);
  });

  it('compact format: small amount stays full format', () => {
    const formatted = CurrencyFormatter.formatCompact(999, 'EUR');
    expect(formatted).toMatch(/999/);
  });

  it('getCurrencySymbol returns symbol for EUR', () => {
    const symbol = CurrencyFormatter.getCurrencySymbol('EUR');
    expect(symbol).toBe('€');
  });

  it('getCurrencySymbol returns symbol for USD', () => {
    const symbol = CurrencyFormatter.getCurrencySymbol('USD');
    expect(symbol).toBe('$');
  });

  it('formatNumber formats without currency', () => {
    const formatted = CurrencyFormatter.formatNumber(1234.5, 'en-US', 2);
    expect(formatted).toMatch(/1[,.]234[,.]50/);
  });
});
