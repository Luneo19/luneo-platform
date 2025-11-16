type ClassValue = string | number | null | undefined | Record<string, boolean> | ClassValue[];

export const isBrowser = typeof window !== 'undefined';

export const cn = (...inputs: ClassValue[]): string => {
  const classes: string[] = [];

  inputs.forEach((input) => {
    if (!input) {
      return;
    }

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
      return;
    }

    if (Array.isArray(input)) {
      classes.push(cn(...input));
      return;
    }

    if (typeof input === 'object') {
      Object.entries(input).forEach(([key, value]) => {
        if (value) {
          classes.push(key);
        }
      });
    }
  });

  return classes.join(' ');
};

export interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export const safeFetch = async (
  input: RequestInfo | URL,
  init: SafeFetchOptions = {}
): Promise<Response> => {
  const { timeoutMs = 15_000, ...rest } = init;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'strict-origin-when-cross-origin',
      ...rest,
      signal: rest.signal ?? controller.signal,
    });

    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
};

export const toDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const now = (): number => Date.now();


