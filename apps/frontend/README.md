# 🚀 Luneo Enterprise Frontend

**Last Updated:** November 16, 2025

Frontend premium Next.js 15 + TypeScript pour la plateforme Luneo Enterprise.

## ✨ Fonctionnalités

- **Next.js 15** avec App Router
- **TypeScript** strict mode
- **Tailwind CSS** + Design Tokens
- **shadcn/ui** components
- **TanStack Query** pour la gestion des données
- **Zustand** pour le state management
- **React Hook Form + Zod** pour les formulaires
- **Framer Motion** pour les animations
- **Authentication** complète
- **Responsive Design** mobile-first
- **Accessibility** WCAG 2.1 AA
- **Performance** optimisée (Lighthouse 90+)

## 🏗️ Architecture

```
frontend/
├── src/
│   ├── app/                    # App Router (Next.js 15)
│   │   ├── (auth)/            # Auth routes
│   │   ├── (dashboard)/       # Dashboard routes
│   │   └── api/               # API routes
│   ├── components/            # React Components
│   │   ├── ui/               # Base UI components
│   │   ├── layout/           # Layout components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── forms/            # Form components
│   │   └── charts/           # Chart components
│   ├── lib/                  # Utilities & API
│   │   ├── api/              # API client
│   │   ├── hooks/            # Custom hooks
│   │   └── utils/            # Utilities
│   ├── store/                # State management
│   ├── styles/               # Styles & tokens
│   └── types/                # TypeScript types
├── public/                   # Static assets
└── tests/                    # Tests
```

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 20+
- npm 10+

### Installation

```bash
# Cloner le repository
git clone <repository-url>
cd frontend

# Installer les dépendances
npm install

# Copier les variables d'environnement
cp env.example .env.local

# Démarrer le serveur de développement
npm run dev
```

### Variables d'Environnement

Créez un fichier `.env.local` avec :

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Cloudinary (optionnel)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## 📜 Scripts Disponibles

```bash
# Développement
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production

# Qualité du code
npm run lint         # ESLint
npm run format       # Prettier
npm run type-check   # TypeScript

# Tests
npm run test         # Tests unitaires
npm run test:e2e     # Tests E2E
npm run test:coverage # Couverture de tests
```

## 🎨 Design System

### Design Tokens

Les tokens de design sont centralisés dans `src/styles/tokens.json` :

- **Couleurs** : Brand, neutral, success, warning, danger
- **Typographie** : Font families, sizes, weights
- **Espacements** : Spacing scale cohérent
- **Rayons** : Border radius variants
- **Ombres** : Shadow system
- **Animations** : Motion tokens

### Composants UI

Composants basés sur **Radix UI** + **Tailwind CSS** :

- `Button` - Boutons avec variants
- `Input` - Champs de saisie
- `Card` - Cartes avec hover effects
- `Modal` - Modales accessibles
- `Toast` - Notifications
- Et plus...

### Utilisation

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function MyComponent() {
  return (
    <Card className="card-hover">
      <CardContent>
        <Button variant="primary" size="lg">
          Action
        </Button>
      </CardContent>
    </Card>
  );
}
```

## 🔐 Authentication

### Hook useAuth

```tsx
import { useAuth } from '@/hooks/useAuth';

export function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }
  
  return <Dashboard user={user} onLogout={logout} />;
}
```

### Routes Protégées

```tsx
import { useRequireAuth } from '@/hooks/useAuth';

export function ProtectedPage() {
  const { user, isLoading } = useRequireAuth();
  
  if (isLoading) return <Loading />;
  
  return <div>Welcome {user?.firstName}!</div>;
}
```

## 📊 Gestion des Données

### TanStack Query

```tsx
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';

export function UserProfile() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  if (isLoading) return <Loading />;
  
  return <div>{user?.firstName}</div>;
}
```

### API Client

```tsx
import { apiClient } from '@/lib/api/client';

// GET request
const users = await apiClient.get<User[]>('/users');

// POST request
const newUser = await apiClient.post<User>('/users', userData);

// File upload
const result = await apiClient.uploadFile('/upload', file, (progress) => {
  console.log(`Upload: ${progress}%`);
});
```

## 🎯 Performance

### Optimisations Incluses

- **Next.js 15** avec optimisations automatiques
- **Image Optimization** avec `next/image`
- **Font Optimization** avec `next/font`
- **Code Splitting** automatique
- **Bundle Analysis** disponible
- **Lighthouse Score** 90+

### Mesures de Performance

```bash
# Analyser le bundle
npm run build
npm run analyze

# Lighthouse CI
npm run lighthouse
```

## 🧪 Tests

### Tests Unitaires

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Tests E2E

```tsx
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('/dashboard');
});
```

## 🚀 Déploiement

### Vercel (Recommandé)

1. Connectez votre repository GitHub à Vercel
2. Configurez les variables d'environnement
3. Déployez automatiquement

### Variables d'Environnement Production

```env
NEXT_PUBLIC_API_URL=https://api.luneo.app/api
NEXT_PUBLIC_APP_URL=https://luneo.app
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://luneo.app
```

### Docker

```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runtime
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

## 📱 Responsive Design

### Breakpoints

- **Mobile** : < 640px
- **Tablet** : 640px - 1024px
- **Desktop** : > 1024px

### Mobile-First

```tsx
// Mobile-first approach
<div className="flex flex-col md:flex-row lg:grid lg:grid-cols-3">
  <div className="w-full md:w-1/2 lg:w-auto">Content</div>
</div>
```

## ♿ Accessibilité

### Standards WCAG 2.1 AA

- **Contraste** : Ratios >= 4.5:1
- **Navigation clavier** : Tab order logique
- **Screen readers** : ARIA labels
- **Focus visible** : Indicateurs clairs
- **Reduced motion** : Respect des préférences

### Composants Accessibles

```tsx
<Button
  aria-label="Fermer la modal"
  aria-describedby="modal-description"
>
  <X className="h-4 w-4" aria-hidden="true" />
</Button>
```

## 🔧 Configuration

### ESLint

```json
{
  "extends": ["next", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "react-hooks/rules-of-hooks": "error"
  }
}
```

### Prettier

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## 📈 Monitoring

### Analytics

- **Vercel Analytics** intégré
- **Web Vitals** tracking
- **Error Boundary** avec Sentry (optionnel)

### Performance Monitoring

```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## 🤝 Contribution

### Workflow

1. Fork le repository
2. Créez une branche feature
3. Commitez vos changements
4. Push vers votre fork
5. Créez une Pull Request

### Standards

- **Conventional Commits** obligatoires
- **Tests** requis pour les nouvelles features
- **TypeScript** strict
- **ESLint** sans erreurs
- **Accessibilité** validée

## 📄 Licence

© 2025 Luneo Enterprise. Tous droits réservés.

---

**Prêt à coder ?** 🚀

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) pour voir le résultat !

