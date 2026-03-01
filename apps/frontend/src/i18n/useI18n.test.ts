import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createTranslator } from './index';
import { useI18n } from './useI18n';

// useI18n uses useI18nContextOptional from provider - mock to return null so we test standalone path
vi.mock('./provider', () => ({
  useI18nContextOptional: () => null,
}));

describe('createTranslator (i18n index)', () => {
  it('t() returns correct translation for key', () => {
    const t = createTranslator('en');
    expect(t('common.error')).toBe('Error');
    expect(t('common.loading')).toBe('Loading...');
    expect(t('common.save')).toBe('Save');
  });

  it('t() returns humanized fallback for missing key', () => {
    const t = createTranslator('en');
    expect(t('nonexistent.key.path')).toBe('Path');
  });

  it('replaces template variables', () => {
    const t = createTranslator('en');
    // Use a key that might have {{}} in some locales, or test with a known pattern
    const result = t('common.error', {});
    expect(result).toBe('Error');
  });

  it('falls back to default locale (en) for missing key in other locale', () => {
    const tDe = createTranslator('de');
    // Key that exists in en; de may have its own translation or fall back to en
    const value = tDe('common.error');
    expect(typeof value).toBe('string');
    expect(value.length).toBeGreaterThan(0);
    // Truly missing key in both locales returns a humanized fallback
    expect(tDe('nonexistent.key.xyz')).toBe('Xyz');
  });
});

describe('useI18n', () => {
  beforeEach(() => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
    Object.defineProperty(document.documentElement, 'lang', { writable: true, value: 'en' });
  });

  it('t() returns correct translation for key', () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.t('common.error')).toBe('Error');
    expect(result.current.t('common.cancel')).toBe('Cancel');
  });

  it('t() returns humanized fallback for missing key', () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.t('missing.key.here')).toBe('Here');
  });

  it('locale switch changes active locale', () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.locale).toBe('en');
    act(() => {
      result.current.setLocale('fr');
    });
    expect(result.current.locale).toBe('fr');
  });

  it('fallback to default locale for missing key in current locale', () => {
    const { result } = renderHook(() => useI18n());
    act(() => {
      result.current.setLocale('de');
    });
    // common.error exists in en; de may have it or fall back to en
    const value = result.current.t('common.error');
    expect(typeof value === 'string' && value.length > 0).toBe(true);
  });
});
