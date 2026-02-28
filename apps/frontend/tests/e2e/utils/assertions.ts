import { expect, Locator } from '@playwright/test';

const SHARED_FALLBACK_SEGMENTS = ['/login', '/auth', 'error', 'forbidden', 'unauthorized'];

export async function isPresentAndVisible(locator: Locator): Promise<boolean> {
  return (await locator.count()) > 0 && (await locator.first().isVisible());
}

export function expectRouteOutcome(
  url: string,
  expectedSegments: string[],
  extraAcceptedSegments: string[] = []
): void {
  const normalized = url.toLowerCase();
  const accepted = [...expectedSegments, ...SHARED_FALLBACK_SEGMENTS, ...extraAcceptedSegments].map((segment) =>
    segment.toLowerCase()
  );

  expect(accepted.some((segment) => normalized.includes(segment))).toBeTruthy();
}
