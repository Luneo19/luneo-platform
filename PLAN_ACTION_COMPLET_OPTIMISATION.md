# 🚀 PLAN D'ACTION COMPLET - OPTIMISATION & DÉVELOPPEMENT
## Guide d'Implémentation Détaillé pour Améliorer le SaaS Luneo

**Date** : Janvier 2025  
**Objectif** : Passer de 75/100 à 90+/100 (niveau mondial)  
**Durée Estimée** : 6 mois avec équipe de 2-3 développeurs

---

## 📋 TABLE DES MATIÈRES

1. [Phase 1 : Critiques (P0) - Mois 1-2](#phase-1-critiques-p0)
2. [Phase 2 : Haute Priorité (P1) - Mois 3-4](#phase-2-haute-priorité-p1)
3. [Phase 3 : Améliorations (P2) - Mois 5-6](#phase-3-améliorations-p2)
4. [Checklist de Validation](#checklist-de-validation)
5. [Métriques de Succès](#métriques-de-succès)

---

## 🔴 PHASE 1 : CRITIQUES (P0) - MOIS 1-2

### 🎯 OBJECTIF : Résoudre les problèmes bloquants pour la production

**Durée** : 55 jours  
**Équipe** : 2-3 développeurs  
**Priorité** : CRITIQUE

---

### TÂCHE 1.1 : Migration Auth Supabase → NestJS

**Durée** : 10 jours  
**Priorité** : P0  
**Impact** : Sécurité critique

#### Étape 1.1.1 : Backend - Compléter endpoints auth NestJS

**Fichiers à créer/modifier** :

1. **`apps/backend/src/modules/auth/auth.service.ts`** (Améliorer)

```typescript
// Ajouter méthodes manquantes
async forgotPassword(email: string): Promise<void> {
  // 1. Vérifier email existe
  // 2. Générer token reset (JWT avec expiration 1h)
  // 3. Envoyer email avec lien reset
  // 4. Logger action
}

async resetPassword(token: string, newPassword: string): Promise<void> {
  // 1. Valider token
  // 2. Vérifier expiration
  // 3. Hasher nouveau mot de passe
  // 4. Mettre à jour user
  // 5. Invalider token
}

async verifyEmail(token: string): Promise<void> {
  // 1. Valider token
  // 2. Marquer email comme vérifié
  // 3. Logger action
}
```

2. **`apps/backend/src/modules/auth/auth.controller.ts`** (Compléter)

```typescript
@Post('forgot-password')
@Public()
@ApiOperation({ summary: 'Demander réinitialisation mot de passe' })
async forgotPassword(@Body() dto: ForgotPasswordDto) {
  await this.authService.forgotPassword(dto.email);
  return { message: 'Email de réinitialisation envoyé' };
}

@Post('reset-password')
@Public()
@ApiOperation({ summary: 'Réinitialiser mot de passe' })
async resetPassword(@Body() dto: ResetPasswordDto) {
  await this.authService.resetPassword(dto.token, dto.newPassword);
  return { message: 'Mot de passe réinitialisé avec succès' };
}

@Post('verify-email')
@Public()
@ApiOperation({ summary: 'Vérifier email' })
async verifyEmail(@Body() dto: VerifyEmailDto) {
  await this.authService.verifyEmail(dto.token);
  return { message: 'Email vérifié avec succès' };
}
```

3. **`apps/backend/src/modules/auth/dto/forgot-password.dto.ts`** (Créer)

```typescript
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
```

4. **`apps/backend/src/modules/auth/dto/reset-password.dto.ts`** (Créer)

```typescript
import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset_token_here' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewSecurePassword123!' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  newPassword: string;
}
```

5. **`apps/backend/src/modules/auth/dto/verify-email.dto.ts`** (Créer)

```typescript
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: 'verification_token_here' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
```

#### Étape 1.1.2 : Backend - Implémenter httpOnly cookies

**Fichier** : `apps/backend/src/modules/auth/auth-cookies.helper.ts` (Améliorer)

```typescript
import { Response } from 'express';

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
) {
  // Access token (15 min)
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  });

  // Refresh token (7 jours)
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
}
```

**Modifier** : `apps/backend/src/modules/auth/auth.controller.ts`

```typescript
@Post('login')
async login(@Body() dto: LoginDto, @Res() res: Response) {
  const { user, accessToken, refreshToken } = await this.authService.login(dto);
  
  // Utiliser httpOnly cookies au lieu de retourner tokens
  setAuthCookies(res, accessToken, refreshToken);
  
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
}
```

#### Étape 1.1.3 : Frontend - Migrer pages auth vers API NestJS

**Fichier** : `apps/frontend/src/app/(auth)/login/page.tsx` (Modifier)

```typescript
// REMPLACER Supabase par API NestJS
const handleSubmit = useCallback(async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    const { endpoints } = await import('@/lib/api/client');
    
    // Utiliser endpoint NestJS au lieu de Supabase
    const response = await endpoints.auth.login({
      email: formData.email,
      password: formData.password,
    });

    // Les cookies sont automatiquement gérés par le navigateur
    // Rediriger vers dashboard
    router.push('/dashboard');
  } catch (err: any) {
    setError(err.message || 'Erreur de connexion');
    logger.error('Login error', { error: err });
  } finally {
    setIsLoading(false);
  }
}, [formData, router]);
```

**Fichier** : `apps/frontend/src/lib/api/client.ts` (Modifier)

```typescript
// Ajouter configuration pour cookies
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  withCredentials: true, // IMPORTANT: Envoyer cookies automatiquement
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pour refresh token automatique
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token automatique
        await apiClient.post('/api/v1/auth/refresh', {}, {
          withCredentials: true,
        });

        // Réessayer requête originale
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Rediriger vers login si refresh échoue
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

#### Étape 1.1.4 : Frontend - Migrer forgot-password

**Fichier** : `apps/frontend/src/app/(auth)/forgot-password/page.tsx` (Modifier)

```typescript
const handleSubmit = useCallback(async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    const { endpoints } = await import('@/lib/api/client');
    
    // Utiliser endpoint NestJS
    await endpoints.auth.forgotPassword({
      email: formData.email,
    });

    setSuccess('Email de réinitialisation envoyé');
  } catch (err: any) {
    setError(err.message || 'Erreur lors de l\'envoi');
  } finally {
    setIsLoading(false);
  }
}, [formData]);
```

**Fichier** : `apps/frontend/src/lib/api/client.ts` (Ajouter méthode)

```typescript
forgotPassword: async (data: { email: string }) => {
  return apiClient.post('/api/v1/auth/forgot-password', data);
},
```

#### Étape 1.1.5 : Tests

**Fichier** : `apps/backend/src/modules/auth/auth.service.spec.ts` (Créer/Améliorer)

```typescript
describe('AuthService', () => {
  describe('forgotPassword', () => {
    it('should send reset email for valid user', async () => {
      // Test implementation
    });

    it('should not reveal if email exists', async () => {
      // Test email enumeration protection
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      // Test implementation
    });

    it('should reject expired token', async () => {
      // Test expiration
    });
  });
});
```

**Checklist** :
- [ ] Endpoints auth NestJS complets
- [ ] httpOnly cookies implémentés
- [ ] Frontend migré vers API NestJS
- [ ] Tests unitaires écrits
- [ ] Tests E2E auth flow
- [ ] Documentation Swagger mise à jour

---

### TÂCHE 1.2 : Rate Limiting & Protection Brute Force

**Durée** : 5 jours  
**Priorité** : P0  
**Impact** : Sécurité critique

#### Étape 1.2.1 : Backend - Rate Limiting Avancé

**Fichier** : `apps/backend/src/modules/auth/guards/rate-limit-auth.guard.ts` (Créer)

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class RateLimitAuthGuard extends ThrottlerGuard {
  protected getTracker(req: Request): string {
    // Utiliser IP + email pour tracking plus précis
    const email = req.body?.email || 'unknown';
    return `${req.ip}-${email}`;
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const response = context.switchToHttp().getResponse();
    response.status(429).json({
      statusCode: 429,
      message: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
      retryAfter: 60, // secondes
    });
  }
}
```

**Fichier** : `apps/backend/src/modules/auth/auth.controller.ts` (Modifier)

```typescript
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RateLimitAuthGuard } from './guards/rate-limit-auth.guard';

@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  @UseGuards(RateLimitAuthGuard)
  async login(@Body() dto: LoginDto) {
    // Implementation
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 tentatives par heure
  @UseGuards(RateLimitAuthGuard)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    // Implementation
  }
}
```

#### Étape 1.2.2 : Backend - Protection Brute Force avec Redis

**Fichier** : `apps/backend/src/modules/auth/services/brute-force.service.ts` (Créer)

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class BruteForceService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async checkAttempts(identifier: string): Promise<boolean> {
    const key = `brute-force:${identifier}`;
    const attempts = await this.redis.get(key);
    
    if (attempts && parseInt(attempts) >= 5) {
      return false; // Trop de tentatives
    }
    
    return true;
  }

  async recordAttempt(identifier: string): Promise<void> {
    const key = `brute-force:${identifier}`;
    const attempts = await this.redis.incr(key);
    
    if (attempts === 1) {
      // Premier échec, expire dans 15 minutes
      await this.redis.expire(key, 900);
    }
  }

  async resetAttempts(identifier: string): Promise<void> {
    const key = `brute-force:${identifier}`;
    await this.redis.del(key);
  }
}
```

**Fichier** : `apps/backend/src/modules/auth/auth.service.ts` (Modifier)

```typescript
async login(dto: LoginDto): Promise<LoginResponse> {
  const identifier = `${dto.email}-${this.getClientIp()}`;
  
  // Vérifier brute force
  const canAttempt = await this.bruteForceService.checkAttempts(identifier);
  if (!canAttempt) {
    throw new TooManyRequestsException('Trop de tentatives. Veuillez réessayer dans 15 minutes.');
  }

  try {
    const user = await this.validateUser(dto.email, dto.password);
    
    // Réussite : reset attempts
    await this.bruteForceService.resetAttempts(identifier);
    
    // Générer tokens
    const tokens = await this.generateTokens(user);
    
    return { user, ...tokens };
  } catch (error) {
    // Échec : enregistrer tentative
    await this.bruteForceService.recordAttempt(identifier);
    throw error;
  }
}
```

#### Étape 1.2.3 : Frontend - Afficher messages rate limit

**Fichier** : `apps/frontend/src/app/(auth)/login/page.tsx` (Modifier)

```typescript
catch (err: any) {
  if (err.response?.status === 429) {
    setError('Trop de tentatives. Veuillez réessayer dans quelques minutes.');
  } else {
    setError(err.message || 'Erreur de connexion');
  }
  logger.error('Login error', { error: err });
}
```

**Checklist** :
- [ ] Rate limiting configuré (Redis)
- [ ] Protection brute force implémentée
- [ ] Messages d'erreur clairs
- [ ] Tests rate limiting
- [ ] Monitoring des tentatives

---

### TÂCHE 1.3 : 2FA (Two-Factor Authentication)

**Durée** : 5 jours  
**Priorité** : P0  
**Impact** : Sécurité critique

#### Étape 1.3.1 : Backend - Service 2FA

**Fichier** : `apps/backend/src/modules/auth/services/two-factor.service.ts` (Créer)

```typescript
import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class TwoFactorService {
  generateSecret(userEmail: string): { secret: string; qrCodeUrl: string } {
    const secret = speakeasy.generateSecret({
      name: `Luneo (${userEmail})`,
      issuer: 'Luneo',
    });

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url,
    };
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Tolérance de 2 périodes (60s)
    });
  }

  async generateQRCode(otpauthUrl: string): Promise<string> {
    return qrcode.toDataURL(otpauthUrl);
  }
}
```

#### Étape 1.3.2 : Backend - Endpoints 2FA

**Fichier** : `apps/backend/src/modules/auth/auth.controller.ts` (Ajouter)

```typescript
@Post('2fa/setup')
@UseGuards(JwtAuthGuard)
async setup2FA(@Request() req) {
  const { secret, qrCodeUrl } = await this.twoFactorService.generateSecret(req.user.email);
  
  // Sauvegarder secret temporairement (pas encore activé)
  await this.usersService.setTemporary2FASecret(req.user.id, secret);
  
  return {
    secret,
    qrCodeUrl: await this.twoFactorService.generateQRCode(qrCodeUrl),
  };
}

@Post('2fa/verify')
@UseGuards(JwtAuthGuard)
async verify2FA(@Request() req, @Body() dto: { token: string }) {
  const user = await this.usersService.findById(req.user.id);
  const isValid = this.twoFactorService.verifyToken(user.temp2FASecret, dto.token);
  
  if (isValid) {
    // Activer 2FA
    await this.usersService.enable2FA(req.user.id, user.temp2FASecret);
    return { message: '2FA activé avec succès' };
  }
  
  throw new UnauthorizedException('Code invalide');
}

@Post('login')
async login(@Body() dto: LoginDto) {
  const { user, tokens } = await this.authService.validateLogin(dto);
  
  // Si 2FA activé, retourner token temporaire
  if (user.is2FAEnabled) {
    const tempToken = await this.authService.generateTempToken(user.id);
    return {
      requires2FA: true,
      tempToken,
    };
  }
  
  return { user, ...tokens };
}

@Post('login/2fa')
async loginWith2FA(@Body() dto: { tempToken: string; token: string }) {
  const userId = await this.authService.validateTempToken(dto.tempToken);
  const user = await this.usersService.findById(userId);
  
  const isValid = this.twoFactorService.verifyToken(user.twoFASecret, dto.token);
  if (!isValid) {
    throw new UnauthorizedException('Code 2FA invalide');
  }
  
  const tokens = await this.authService.generateTokens(user);
  return { user, ...tokens };
}
```

#### Étape 1.3.3 : Frontend - Page Setup 2FA

**Fichier** : `apps/frontend/src/app/(dashboard)/dashboard/security/2fa-setup/page.tsx` (Créer)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function Setup2FAPage() {
  const [qrCode, setQrCode] = useState<string>('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSetup = async () => {
    setLoading(true);
    try {
      const { endpoints } = await import('@/lib/api/client');
      const { qrCodeUrl } = await endpoints.auth.setup2FA();
      setQrCode(qrCodeUrl);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const { endpoints } = await import('@/lib/api/client');
      await endpoints.auth.verify2FA({ token });
      router.push('/dashboard/security');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Configurer l'authentification à deux facteurs</h2>
      
      {!qrCode ? (
        <Button onClick={handleSetup} disabled={loading}>
          Générer QR Code
        </Button>
      ) : (
        <div>
          <Image src={qrCode} alt="QR Code 2FA" width={200} height={200} />
          <Input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Code à 6 chiffres"
            className="mt-4"
          />
          <Button onClick={handleVerify} disabled={loading} className="mt-4">
            Vérifier et activer
          </Button>
        </div>
      )}
    </Card>
  );
}
```

**Checklist** :
- [ ] Service 2FA créé (TOTP)
- [ ] Endpoints 2FA implémentés
- [ ] Page setup 2FA frontend
- [ ] Intégration dans flow login
- [ ] Tests 2FA
- [ ] Backup codes

---

### TÂCHE 1.4 : Optimisation Performance Backend

**Durée** : 10 jours  
**Priorité** : P0  
**Impact** : Performance critique

#### Étape 1.4.1 : Cache Redis pour Requêtes Fréquentes

**Fichier** : `apps/backend/src/libs/cache/cache.service.ts` (Créer/Améliorer)

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

**Fichier** : `apps/backend/src/modules/products/products.service.ts` (Modifier)

```typescript
@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async findAll(filters: ProductFilters) {
    const cacheKey = `products:${JSON.stringify(filters)}`;
    
    // Vérifier cache
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Requête DB
    const products = await this.prisma.product.findMany({
      where: this.buildWhere(filters),
      include: { brand: true },
    });

    // Mettre en cache (5 minutes)
    await this.cache.set(cacheKey, products, 300);

    return products;
  }

  async update(id: string, data: UpdateProductDto) {
    const product = await this.prisma.product.update({
      where: { id },
      data,
    });

    // Invalider cache
    await this.cache.invalidate('products:*');

    return product;
  }
}
```

#### Étape 1.4.2 : Optimisation Requêtes Prisma

**Fichier** : `apps/backend/src/modules/products/products.service.ts` (Améliorer)

```typescript
async findAll(filters: ProductFilters) {
  // Utiliser select pour limiter champs retournés
  return this.prisma.product.findMany({
    where: this.buildWhere(filters),
    select: {
      id: true,
      name: true,
      price: true,
      // Ne pas inclure description si pas nécessaire
      brand: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    // Utiliser cursor pagination pour grandes listes
    cursor: filters.cursor ? { id: filters.cursor } : undefined,
    take: filters.limit || 20,
    skip: filters.cursor ? 1 : (filters.page - 1) * (filters.limit || 20),
    // Index sur colonnes utilisées
    orderBy: {
      createdAt: 'desc',
    },
  });
}
```

#### Étape 1.4.3 : Database Indexes

**Fichier** : `apps/backend/prisma/migrations/add_performance_indexes/migration.sql` (Créer)

```sql
-- Indexes pour requêtes fréquentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_brand_id ON "Product"("brandId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_created_at ON "Product"("createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status ON "Product"("status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id ON "Order"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON "Order"("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at ON "Order"("createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_designs_user_id ON "Design"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_designs_product_id ON "Design"("productId");

-- Full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search ON "Product" USING gin(to_tsvector('french', name || ' ' || COALESCE(description, '')));
```

**Checklist** :
- [ ] Cache Redis configuré
- [ ] Requêtes Prisma optimisées
- [ ] Indexes database ajoutés
- [ ] Monitoring performance
- [ ] Tests de charge

---

### TÂCHE 1.5 : Tests E2E et Coverage

**Durée** : 20 jours  
**Priorité** : P0  
**Impact** : Qualité code

#### Étape 1.5.1 : Setup Tests E2E

**Fichier** : `apps/frontend/playwright.config.ts` (Créer/Améliorer)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Étape 1.5.2 : Tests E2E Auth Flow

**Fichier** : `apps/frontend/e2e/auth.spec.ts` (Créer)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Erreur')).toBeVisible();
  });

  test('should register new user', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'SecurePass123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
  });
});
```

#### Étape 1.5.3 : Tests Unitaires Backend

**Fichier** : `apps/backend/src/modules/auth/auth.service.spec.ts` (Améliorer)

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Test implementation
    });

    it('should throw error with invalid credentials', async () => {
      // Test implementation
    });

    it('should respect rate limiting', async () => {
      // Test rate limiting
    });
  });

  describe('forgotPassword', () => {
    it('should send email for valid user', async () => {
      // Test implementation
    });

    it('should not reveal if email exists', async () => {
      // Test email enumeration protection
    });
  });
});
```

**Checklist** :
- [ ] Playwright configuré
- [ ] Tests E2E auth flow
- [ ] Tests E2E dashboard
- [ ] Tests unitaires backend (coverage 80%+)
- [ ] CI/CD intégré
- [ ] Coverage reports

---

## 🟡 PHASE 2 : HAUTE PRIORITÉ (P1) - MOIS 3-4

### 🎯 OBJECTIF : Améliorer fonctionnalités principales

**Durée** : 70 jours  
**Équipe** : 2-3 développeurs

---

### TÂCHE 2.1 : Analytics Avancés

**Durée** : 15 jours

#### Étape 2.1.1 : Backend - Funnel Analysis

**Fichier** : `apps/backend/src/modules/analytics/services/funnel.service.ts` (Créer)

```typescript
@Injectable()
export class FunnelService {
  async calculateFunnel(brandId: string, steps: string[], dateRange: DateRange) {
    // Calculer conversion à chaque étape
    const funnel = await Promise.all(
      steps.map(async (step, index) => {
        const count = await this.getStepCount(brandId, step, dateRange);
        const previousCount = index > 0 
          ? await this.getStepCount(brandId, steps[index - 1], dateRange)
          : count;
        
        return {
          step,
          count,
          conversionRate: previousCount > 0 ? (count / previousCount) * 100 : 100,
        };
      })
    );

    return funnel;
  }
}
```

#### Étape 2.1.2 : Backend - Cohort Analysis

**Fichier** : `apps/backend/src/modules/analytics/services/cohort.service.ts` (Créer)

```typescript
@Injectable()
export class CohortService {
  async calculateCohorts(brandId: string, period: 'weekly' | 'monthly') {
    // Grouper utilisateurs par période d'inscription
    // Calculer rétention pour chaque cohorte
    const cohorts = await this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${period}, "createdAt") as cohort,
        COUNT(DISTINCT "userId") as users,
        COUNT(DISTINCT CASE WHEN "createdAt" >= DATE_TRUNC(${period}, "createdAt") THEN "userId" END) as retained
      FROM "User"
      WHERE "brandId" = ${brandId}
      GROUP BY cohort
      ORDER BY cohort DESC
    `;

    return cohorts;
  }
}
```

#### Étape 2.1.3 : Frontend - Page Analytics Avancés

**Fichier** : `apps/frontend/src/app/(dashboard)/dashboard/analytics-advanced/page.tsx` (Créer)

```typescript
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FunnelChart } from '@/components/analytics/FunnelChart';
import { CohortChart } from '@/components/analytics/CohortChart';

export default function AnalyticsAdvancedPage() {
  const [funnelData, setFunnelData] = useState(null);
  const [cohortData, setCohortData] = useState(null);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics Avancés</h1>
      
      <Tabs defaultValue="funnel">
        <TabsList>
          <TabsTrigger value="funnel">Funnel Analysis</TabsTrigger>
          <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="funnel">
          <FunnelChart data={funnelData} />
        </TabsContent>
        
        <TabsContent value="cohorts">
          <CohortChart data={cohortData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Checklist** :
- [ ] Funnel analysis backend
- [ ] Cohort analysis backend
- [ ] Segments backend
- [ ] Frontend charts
- [ ] Export PDF/Excel
- [ ] Tests

---

### TÂCHE 2.2 : AR Studio Complet

**Durée** : 15 jours

#### Étape 2.2.1 : Backend - Upload Modèles AR

**Fichier** : `apps/backend/src/modules/ar/services/ar-upload.service.ts` (Créer)

```typescript
@Injectable()
export class ARUploadService {
  async uploadModel(file: Express.Multer.File, userId: string) {
    // 1. Valider format (USDZ, GLB)
    this.validateFormat(file);
    
    // 2. Upload vers Cloudinary/S3
    const url = await this.storageService.upload(file);
    
    // 3. Générer thumbnail
    const thumbnail = await this.generateThumbnail(file);
    
    // 4. Sauvegarder en DB
    const model = await this.prisma.aRModel.create({
      data: {
        userId,
        glbUrl: url,
        thumbnailUrl: thumbnail,
        status: 'processing',
      },
    });
    
    // 5. Traitement asynchrone (optimisation modèle)
    this.processModelAsync(model.id);
    
    return model;
  }
}
```

#### Étape 2.2.2 : Backend - QR Code Generation

**Fichier** : `apps/backend/src/modules/ar/services/qr-code.service.ts` (Créer)

```typescript
@Injectable()
export class QRCodeService {
  async generateQRCode(modelId: string): Promise<string> {
    const arUrl = `${process.env.APP_URL}/ar/view/${modelId}`;
    
    const qrCode = await qrcode.toDataURL(arUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
    });
    
    return qrCode;
  }
}
```

**Checklist** :
- [ ] Upload modèles AR
- [ ] Preview AR amélioré
- [ ] QR Code generation
- [ ] Analytics AR
- [ ] Frontend intégration
- [ ] Tests

---

### TÂCHE 2.3 : E-commerce Intégrations Complètes

**Durée** : 20 jours

#### Étape 2.3.1 : Shopify - Intégration Complète

**Fichier** : `apps/backend/src/modules/ecommerce/shopify/shopify.service.ts` (Améliorer)

```typescript
@Injectable()
export class ShopifyService {
  async syncProducts(shopifyStoreId: string) {
    // 1. Récupérer produits Shopify
    const shopifyProducts = await this.shopifyClient.products.list();
    
    // 2. Transformer en format Luneo
    const products = shopifyProducts.map(this.transformProduct);
    
    // 3. Créer/Mettre à jour en batch
    await this.prisma.$transaction(
      products.map(product => 
        this.prisma.product.upsert({
          where: { externalId: product.externalId },
          update: product,
          create: product,
        })
      )
    );
    
    // 4. Logger sync
    await this.logSync(shopifyStoreId, products.length);
  }

  async syncOrders(shopifyStoreId: string) {
    // Même logique pour commandes
  }
}
```

**Checklist** :
- [ ] Shopify sync complet
- [ ] WooCommerce sync complet
- [ ] Magento sync complet
- [ ] Webhooks robustes
- [ ] Gestion erreurs
- [ ] Tests

---

### TÂCHE 2.4 : Marketplace Complet

**Durée** : 20 jours

#### Étape 2.4.1 : Seller Dashboard Complet

**Fichier** : `apps/backend/src/modules/marketplace/services/seller.service.ts` (Créer)

```typescript
@Injectable()
export class SellerService {
  async getSellerStats(sellerId: string) {
    return {
      totalProducts: await this.countProducts(sellerId),
      totalOrders: await this.countOrders(sellerId),
      totalRevenue: await this.calculateRevenue(sellerId),
      averageRating: await this.getAverageRating(sellerId),
      reviews: await this.getReviews(sellerId),
    };
  }

  async getSellerProducts(sellerId: string, filters: ProductFilters) {
    return this.prisma.product.findMany({
      where: {
        sellerId,
        ...this.buildWhere(filters),
      },
    });
  }

  async getSellerOrders(sellerId: string, filters: OrderFilters) {
    return this.prisma.order.findMany({
      where: {
        items: {
          some: {
            product: {
              sellerId,
            },
          },
        },
        ...this.buildWhere(filters),
      },
    });
  }
}
```

**Checklist** :
- [ ] Seller dashboard backend
- [ ] Seller products management
- [ ] Seller orders management
- [ ] Reviews & ratings
- [ ] Payouts système
- [ ] Frontend seller dashboard
- [ ] Tests

---

## 🟢 PHASE 3 : AMÉLIORATIONS (P2) - MOIS 5-6

### 🎯 OBJECTIF : Polish et features avancées

**Durée** : 80 jours  
**Équipe** : 2-3 développeurs

---

### TÂCHE 3.1 : Design Refonte UX/UI

**Durée** : 30 jours

#### Étape 3.1.1 : Design System Complet

**Fichier** : `apps/frontend/src/styles/design-system.css` (Créer)

```css
:root {
  /* Couleurs primaires */
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #818cf8;
  
  /* Espacements */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Typographie */
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Animations */
  --transition-fast: 150ms;
  --transition-normal: 300ms;
  --transition-slow: 500ms;
}
```

#### Étape 3.1.2 : Composants UI Améliorés

**Fichier** : `apps/frontend/src/components/ui/button.tsx` (Améliorer)

```typescript
// Ajouter variants, sizes, loading states
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {props.children}
      </button>
    );
  }
);
```

**Checklist** :
- [ ] Design system complet
- [ ] Composants UI améliorés
- [ ] Dark mode amélioré
- [ ] Animations micro-interactions
- [ ] Responsive amélioré
- [ ] Accessibilité (a11y)

---

### TÂCHE 3.2 : Features Avancées

**Durée** : 40 jours

#### Étape 3.2.1 : Real-time Collaboration

**Fichier** : `apps/backend/src/modules/collaboration/collaboration.gateway.ts` (Créer)

```typescript
@WebSocketGateway({ cors: true })
export class CollaborationGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join-room')
  handleJoinRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.roomId);
    this.server.to(data.roomId).emit('user-joined', { userId: client.data.userId });
  }

  @SubscribeMessage('cursor-move')
  handleCursorMove(@MessageBody() data: { x: number; y: number }, @ConnectedSocket() client: Socket) {
    client.to(data.roomId).emit('cursor-update', {
      userId: client.data.userId,
      x: data.x,
      y: data.y,
    });
  }
}
```

**Checklist** :
- [ ] WebSocket setup
- [ ] Real-time collaboration
- [ ] Cursor tracking
- [ ] Presence indicators
- [ ] Conflict resolution
- [ ] Tests

---

### TÂCHE 3.3 : Documentation Complète

**Durée** : 10 jours

#### Étape 3.3.1 : Documentation API

**Fichier** : `apps/backend/src/swagger.ts` (Améliorer)

```typescript
export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Luneo API')
    .setDescription('API complète pour la plateforme Luneo')
    .setVersion('2.0.0')
    .addBearerAuth()
    .addTag('auth', 'Authentification')
    .addTag('products', 'Produits')
    // ... autres tags
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Luneo API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });
}
```

**Checklist** :
- [ ] Swagger complet
- [ ] Documentation développeurs
- [ ] Guides d'intégration
- [ ] Exemples code
- [ ] Changelog
- [ ] Migration guides

---

## ✅ CHECKLIST DE VALIDATION

### Pour chaque tâche complétée :

- [ ] Code développé et testé
- [ ] Tests unitaires écrits (coverage 80%+)
- [ ] Tests E2E écrits (si applicable)
- [ ] Documentation mise à jour
- [ ] Code review effectué
- [ ] Déployé en staging
- [ ] Tests staging réussis
- [ ] Déployé en production
- [ ] Monitoring configuré
- [ ] Métriques trackées

---

## 📊 MÉTRIQUES DE SUCCÈS

### Objectifs à atteindre :

| Métrique | Actuel | Cible | Mesure |
|----------|--------|-------|--------|
| Score Global | 75/100 | 90/100 | Audit mensuel |
| Coverage Tests | <20% | 80%+ | Jest/Vitest |
| Performance API | >500ms | <200ms | Monitoring |
| Performance Frontend | 60/100 | 90/100 | Lighthouse |
| Sécurité | 70/100 | 95/100 | Audit sécurité |
| Uptime | 99% | 99.9% | Monitoring |

---

## 🎯 CONCLUSION

Ce plan d'action détaillé couvre toutes les améliorations nécessaires pour passer de **75/100 à 90+/100**.

**Durée totale** : **6 mois** avec équipe de 2-3 développeurs

**Priorités** :
1. **P0** : Sécurité et performance (Mois 1-2)
2. **P1** : Fonctionnalités principales (Mois 3-4)
3. **P2** : Polish et features avancées (Mois 5-6)

**Prochaines étapes** :
1. Valider plan avec équipe
2. Assigner tâches
3. Setup tracking (Jira/Linear)
4. Démarrer Phase 1

---

**Document créé le** : Janvier 2025  
**Dernière mise à jour** : Janvier 2025
