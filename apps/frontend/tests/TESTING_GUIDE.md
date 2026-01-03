# 🧪 Guide de Standardisation des Tests - Luneo Platform

**Guide complet pour créer et maintenir des tests professionnels**

---

## 📋 Table des Matières

1. [Structure des Tests](#structure-des-tests)
2. [Patterns de Test](#patterns-de-test)
3. [Helpers Réutilisables](#helpers-réutilisables)
4. [Conventions de Nommage](#conventions-de-nommage)
5. [Best Practices](#best-practices)
6. [Configuration](#configuration)

---

## 📁 Structure des Tests

### Organisation des Fichiers

```
apps/frontend/
├── src/
│   ├── components/
│   │   └── ui/
│   │       └── __tests__/          # Tests unitaires des composants UI
│   │           └── button.test.tsx
│   ├── lib/
│   │   ├── services/
│   │   │   └── __tests__/          # Tests unitaires des services
│   │   │       └── BillingService.test.ts
│   │   └── hooks/
│   │       └── __tests__/          # Tests unitaires des hooks
│   │           └── useBilling.test.ts
│   └── hooks/
│       └── __tests__/              # Tests des hooks personnalisés
│           └── useCredits.test.ts
├── tests/
│   ├── e2e/                         # Tests E2E (Playwright)
│   │   ├── workflows/              # Scénarios complets
│   │   │   ├── registration-to-design.spec.ts
│   │   │   ├── checkout-to-confirmation.spec.ts
│   │   │   └── upload-to-export.spec.ts
│   │   ├── cross-browser.spec.ts
│   │   └── utils/                  # Helpers E2E
│   │       ├── auth.ts
│   │       └── locale.ts
│   ├── api/                         # Tests API
│   │   └── routes.test.ts
│   └── security/                    # Tests sécurité
│       └── csrf.test.ts
└── __tests__/                       # Tests legacy (à migrer progressivement)
    └── components/
        └── Button.test.tsx          # ⚠️ DOUBLON - À migrer vers src/components/ui/__tests__/
```

### Règles de Placement

- **Tests unitaires**: À côté du code source dans `src/**/__tests__/`
- **Tests E2E**: Dans `tests/e2e/`
- **Tests API**: Dans `tests/api/`
- **Tests sécurité**: Dans `tests/security/`

---

## 🎯 Patterns de Test

### Pattern AAA (Arrange-Act-Assert)

```typescript
describe('MyComponent', () => {
  it('should do something', () => {
    // Arrange: Préparer les données et mocks
    const mockData = { id: '123', name: 'Test' };
    vi.mock('@/lib/api', () => ({
      fetchData: vi.fn().mockResolvedValue(mockData),
    }));

    // Act: Exécuter l'action
    render(<MyComponent />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Assert: Vérifier le résultat
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### Pattern de Test de Hook

```typescript
describe('useMyHook', () => {
  it('should return initial state', () => {
    // Arrange
    const { result } = renderHook(() => useMyHook());

    // Act & Assert
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('should handle error', async () => {
    // Arrange
    vi.mock('@/lib/api', () => ({
      fetchData: vi.fn().mockRejectedValue(new Error('API Error')),
    }));

    // Act
    const { result, waitFor } = renderHook(() => useMyHook());

    // Assert
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

### Pattern de Test de Service

```typescript
describe('MyService', () => {
  let service: MyService;
  let mockDb: any;

  beforeEach(() => {
    // Arrange: Setup mocks
    mockDb = {
      findUnique: vi.fn(),
      create: vi.fn(),
    };
    vi.mock('@/lib/db', () => ({ db: mockDb }));
    service = new MyService();
  });

  it('should create item', async () => {
    // Arrange
    const itemData = { name: 'Test' };
    mockDb.create.mockResolvedValue({ id: '123', ...itemData });

    // Act
    const result = await service.create(itemData);

    // Assert
    expect(result).toEqual({ id: '123', ...itemData });
    expect(mockDb.create).toHaveBeenCalledWith({ data: itemData });
  });
});
```

### Pattern de Test E2E

```typescript
test.describe('Feature Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
    await ensureCookieBannerClosed(page);
  });

  test('should complete workflow', async ({ page }) => {
    // Arrange: Navigation
    await page.goto('/feature');
    
    // Act: Interactions
    await page.getByRole('button', { name: /action/i }).click();
    
    // Assert: Vérifications
    await expect(page).toHaveURL(/.*success/);
    await expect(page.getByText(/success/i)).toBeVisible();
  });
});
```

---

## 🛠️ Helpers Réutilisables

### Helpers Unitaires

Créer `src/test/helpers.ts`:

```typescript
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Wrapper avec providers
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Render helper avec providers
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

// Mock factory pour services
export const createMockService = <T,>(defaults: Partial<T> = {}): T => {
  return {
    ...defaults,
  } as T;
};
```

### Helpers E2E

Créer `tests/e2e/utils/common.ts`:

```typescript
import { Page } from '@playwright/test';

/**
 * Attend que la page soit complètement chargée
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Génère un email unique pour les tests
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test-luneo.app`;
}

/**
 * Vérifie qu'un élément est visible avec timeout
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return true;
  } catch {
    return false;
  }
}
```

---

## 📝 Conventions de Nommage

### Fichiers de Test

- **Unitaires**: `*.test.ts` ou `*.test.tsx`
- **E2E**: `*.spec.ts`
- **Placement**: À côté du code ou dans `__tests__/`

### Noms de Tests

```typescript
// ✅ Bon
describe('Button Component', () => {
  it('should render with default props', () => {});
  it('should handle click events', () => {});
  it('should be disabled when loading', () => {});
});

// ❌ Mauvais
describe('Button', () => {
  it('test 1', () => {});
  it('works', () => {});
});
```

### Structure des Describe

```typescript
describe('ComponentName', () => {
  describe('Rendering', () => {
    // Tests de rendu
  });

  describe('Interactions', () => {
    // Tests d'interactions
  });

  describe('Edge Cases', () => {
    // Tests de cas limites
  });
});
```

---

## ✅ Best Practices

### 1. Isolation des Tests

```typescript
describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset state
  });

  afterEach(() => {
    cleanup();
  });
});
```

### 2. Mocks Réalistes

```typescript
// ✅ Bon: Mock réaliste
vi.mock('@/lib/api', () => ({
  fetchData: vi.fn().mockResolvedValue({ id: '123', name: 'Test' }),
}));

// ❌ Mauvais: Mock trop simplifié
vi.mock('@/lib/api', () => ({
  fetchData: vi.fn().mockReturnValue({}),
}));
```

### 3. Tests Déterministes

```typescript
// ✅ Bon: Utiliser des valeurs fixes
const testEmail = 'test@example.com';

// ❌ Mauvais: Utiliser Date.now() sans seed
const testEmail = `test-${Date.now()}@example.com`;
```

### 4. Accessibilité

```typescript
// ✅ Bon: Utiliser des sélecteurs accessibles
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText('Email');

// ❌ Mauvais: Utiliser des sélecteurs fragiles
screen.getByTestId('submit-btn-123');
container.querySelector('.btn-primary');
```

### 5. Async/Await

```typescript
// ✅ Bon: Utiliser waitFor pour async
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// ❌ Mauvais: Attendre avec setTimeout
setTimeout(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
}, 1000);
```

---

## ⚙️ Configuration

### Vitest (Unit Tests)

- **Config**: `vitest.config.mjs`
- **Setup**: `src/test/setup.ts`
- **Coverage**: V8 provider, lcov reporter

### Playwright (E2E Tests)

- **Config**: `playwright.config.ts` (tous navigateurs)
- **Smoke**: `playwright.smoke.config.ts` (Chrome uniquement)
- **TestDir**: `./e2e` (principal) ou `./tests/e2e` (smoke)

---

## 🔍 Checklist de Qualité

Avant de commit un test:

- [ ] Le test est isolé (pas de dépendances externes)
- [ ] Les mocks sont réalistes
- [ ] Les assertions sont claires
- [ ] Le test est déterministe
- [ ] Les sélecteurs sont accessibles
- [ ] Les erreurs sont gérées
- [ ] Le test suit le pattern AAA
- [ ] Le nom du test est descriptif

---

## 📚 Ressources

- [Testing Library](https://testing-library.com/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)








