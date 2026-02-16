/**
 * i18n Module — Barrel export
 * Re-exports everything from _core.ts (data + utilities) and useI18n hook.
 * The actual logic lives in _core.ts to avoid circular dependencies:
 *   index.ts → re-exports from _core.ts AND useI18n.ts
 *   useI18n.ts → imports from _core.ts (NOT from index.ts)
 */

export {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_NAMES,
  LOCALE_FLAGS,
  createTranslator,
  formatDate,
  formatCurrency,
  formatNumber,
  formatRelativeTime,
  detectBrowserLocale,
  en,
  fr,
} from './_core';

export type { Locale, TranslationDict } from './_core';

export { useI18n } from './useI18n';
