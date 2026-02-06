/**
 * Integration Tests - OAuth Workflow
 * Tests OAuth account management at database level
 * (Full OAuth flow requires external providers)
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

describeIntegration('OAuth Workflow Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createIntegrationTestApp();
    app = testApp.app;
    moduleFixture = testApp.moduleFixture;
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  }, 60000);

  afterAll(async () => {
    await closeIntegrationTestApp(app);
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.oAuthAccount.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.design.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.userQuota.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.brand.deleteMany({});
  });

  describe('Google OAuth Flow', () => {
    it('should create OAuth account for new user', async () => {
      const timestamp = Date.now();
      
      // Create user (simulating OAuth user creation)
      const user = await prisma.user.create({
        data: {
          email: `google-user-${timestamp}@example.com`,
          firstName: 'Google',
          lastName: 'User',
          emailVerified: true, // OAuth emails are pre-verified
          role: UserRole.CONSUMER,
        },
      });

      // Create OAuth account
      const oauthAccount = await prisma.oAuthAccount.create({
        data: {
          provider: 'google',
          providerId: `google-${timestamp}`,
          userId: user.id,
          accessToken: 'google-access-token',
          refreshToken: 'google-refresh-token',
        },
      });

      expect(oauthAccount.provider).toBe('google');
      expect(oauthAccount.userId).toBe(user.id);
      expect(oauthAccount.providerId).toBe(`google-${timestamp}`);
    });

    it('should link OAuth account to existing user with password', async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('Password123!', 13);
      
      // Create existing user with password
      const existingUser = await prisma.user.create({
        data: {
          email: `existing-${timestamp}@example.com`,
          firstName: 'Existing',
          lastName: 'User',
          password: hashedPassword,
          emailVerified: true,
          role: UserRole.CONSUMER,
        },
      });

      // Link Google OAuth account
      const oauthAccount = await prisma.oAuthAccount.create({
        data: {
          provider: 'google',
          providerId: `google-link-${timestamp}`,
          userId: existingUser.id,
          accessToken: 'google-access-token',
          refreshToken: 'google-refresh-token',
        },
      });

      expect(oauthAccount.userId).toBe(existingUser.id);

      // Verify user has OAuth account
      const userWithOAuth = await prisma.user.findUnique({
        where: { id: existingUser.id },
        include: { oauthAccounts: true },
      });

      expect(userWithOAuth?.oauthAccounts).toHaveLength(1);
      expect(userWithOAuth?.oauthAccounts[0].provider).toBe('google');
    });

    it('should prevent duplicate OAuth accounts for same provider', async () => {
      const timestamp = Date.now();
      
      const user = await prisma.user.create({
        data: {
          email: `oauth-dup-${timestamp}@example.com`,
          firstName: 'OAuth',
          lastName: 'Duplicate',
          emailVerified: true,
          role: UserRole.CONSUMER,
        },
      });

      // Create first OAuth account
      await prisma.oAuthAccount.create({
        data: {
          provider: 'google',
          providerId: `google-dup-${timestamp}`,
          userId: user.id,
          accessToken: 'token1',
        },
      });

      // Try to create duplicate - should fail
      await expect(
        prisma.oAuthAccount.create({
          data: {
            provider: 'google',
            providerId: `google-dup-${timestamp}`,
            userId: user.id,
            accessToken: 'token2',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('GitHub OAuth Flow', () => {
    it('should create OAuth account for GitHub user', async () => {
      const timestamp = Date.now();
      
      const user = await prisma.user.create({
        data: {
          email: `github-user-${timestamp}@example.com`,
          firstName: 'GitHub',
          lastName: 'User',
          emailVerified: true,
          role: UserRole.CONSUMER,
        },
      });

      const oauthAccount = await prisma.oAuthAccount.create({
        data: {
          provider: 'github',
          providerId: `github-${timestamp}`,
          userId: user.id,
          accessToken: 'github-access-token',
        },
      });

      expect(oauthAccount.provider).toBe('github');
      expect(oauthAccount.userId).toBe(user.id);
    });
  });

  describe('Multiple OAuth Providers', () => {
    it('should allow user to link multiple OAuth providers', async () => {
      const timestamp = Date.now();
      
      const user = await prisma.user.create({
        data: {
          email: `multi-oauth-${timestamp}@example.com`,
          firstName: 'Multi',
          lastName: 'OAuth',
          emailVerified: true,
          role: UserRole.CONSUMER,
        },
      });

      // Link Google
      await prisma.oAuthAccount.create({
        data: {
          provider: 'google',
          providerId: `google-multi-${timestamp}`,
          userId: user.id,
          accessToken: 'google-token',
        },
      });

      // Link GitHub
      await prisma.oAuthAccount.create({
        data: {
          provider: 'github',
          providerId: `github-multi-${timestamp}`,
          userId: user.id,
          accessToken: 'github-token',
        },
      });

      // Verify both are linked
      const userWithOAuth = await prisma.user.findUnique({
        where: { id: user.id },
        include: { oauthAccounts: true },
      });

      expect(userWithOAuth?.oauthAccounts).toHaveLength(2);
      expect(userWithOAuth?.oauthAccounts.map(a => a.provider).sort()).toEqual(['github', 'google']);
    });
  });

  describe('OAuth User Properties', () => {
    it('should create user without password when using OAuth', async () => {
      const timestamp = Date.now();
      
      // OAuth users don't need password
      const oauthUser = await prisma.user.create({
        data: {
          email: `oauth-nopass-${timestamp}@example.com`,
          firstName: 'OAuth',
          lastName: 'NoPassword',
          emailVerified: true, // OAuth emails are pre-verified
          role: UserRole.CONSUMER,
          // No password field
        },
      });

      expect(oauthUser.password).toBeNull();
      expect(oauthUser.emailVerified).toBe(true);
    });
  });
});
