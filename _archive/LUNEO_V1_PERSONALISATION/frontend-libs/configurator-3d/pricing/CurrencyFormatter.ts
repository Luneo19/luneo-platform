/**
 * Currency Formatter - Format amounts for display
 * Uses Intl.NumberFormat for locale-aware formatting
 */

export class CurrencyFormatter {
  /**
   * Format amount with full locale-aware display
   */
  static format(
    amount: number,
    currency: string,
    locale?: string
  ): string {
    const loc = locale ?? typeof navigator !== 'undefined' ? navigator.language : 'en-US';
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Compact format for tight spaces: $1.2K, 500 EUR, €2.5M
   */
  static formatCompact(amount: number, currency: string): string {
    const symbol = this.getCurrencySymbol(currency);
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (abs >= 1_000_000) {
      const value = abs / 1_000_000;
      return `${sign}${symbol}${this.formatCompactValue(value)}M`;
    }
    if (abs >= 1_000) {
      const value = abs / 1_000;
      return `${sign}${symbol}${this.formatCompactValue(value)}K`;
    }

    return this.format(amount, currency);
  }

  /**
   * Get currency symbol for code (e.g. EUR -> €, USD -> $)
   */
  static getCurrencySymbol(currency: string): string {
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
      });
      const parts = formatter.formatToParts(0);
      const symbolPart = parts.find((p) => p.type === 'currency');
      return symbolPart?.value ?? currency;
    } catch {
      return currency;
    }
  }

  /**
   * Format number without currency (for custom display)
   */
  static formatNumber(
    amount: number,
    locale?: string,
    decimals = 2
  ): string {
    const loc = locale ?? typeof navigator !== 'undefined' ? navigator.language : 'en-US';
    return new Intl.NumberFormat(loc, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  }

  private static formatCompactValue(value: number): string {
    if (value >= 100) return Math.round(value).toString();
    if (value >= 10) return value.toFixed(1);
    if (value >= 1) return value.toFixed(1);
    return value.toFixed(1);
  }
}
