import 'server-only';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.BACKEND_API_URL ??
  'http://localhost:3001/api/v1';

interface FeatureFlagsServerResponse {
  updatedAt?: string;
  flags?: Record<string, boolean>;
}

export async function loadFeatureFlags(): Promise<{
  flags: Record<string, boolean>;
  updatedAt: string | null;
}> {
  const endpoint = `${API_BASE.replace(/\/$/, '')}/feature-flags`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: {
        revalidate: 30,
      },
    });

    if (!response.ok) {
      return { flags: {}, updatedAt: null };
    }

    const data = (await response.json()) as FeatureFlagsServerResponse;
    return {
      flags: data.flags ?? {},
      updatedAt: data.updatedAt ?? null,
    };
  } catch {
    return { flags: {}, updatedAt: null };
  }
}

