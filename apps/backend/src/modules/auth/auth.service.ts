import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { hashPassword, verifyPassword } from '@/libs/crypto/password-hasher';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { EncryptionService } from '@/libs/crypto/encryption.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { Login2FADto } from './dto/login-2fa.dto';
import { Prisma, PlatformRole } from '@prisma/client';
import { BruteForceService } from './services/brute-force.service';
import { TwoFactorService } from './services/two-factor.service';
import { CaptchaService } from './services/captcha.service';
import { TokenService } from './services/token.service';
import { OAuthService } from './services/oauth.service';
import { TokenBlacklistService } from '@/libs/auth/token-blacklist.service';
import { ReferralService } from '../referral/referral.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private encryptionService: EncryptionService,
    private bruteForceService: BruteForceService,
    private twoFactorService: TwoFactorService,
    private captchaService: CaptchaService,
    private tokenService: TokenService,
    private oauthService: OAuthService,
    private referralService: ReferralService,
    // SECURITY FIX: Inject token blacklist for immediate revocation on password changes
    private tokenBlacklist: TokenBlacklistService,
  ) {}

  /**
   * SEC-05: Chiffre un token OAuth pour stockage sécurisé
   */
  private encryptOAuthToken(token: string | undefined): string | null {
    if (!token) return null;
    try {
      return this.encryptionService.encrypt(token);
    } catch (error) {
      this.logger.error('Failed to encrypt OAuth token', error);
      throw new InternalServerErrorException('Failed to encrypt OAuth token');
    }
  }

  async signup(signupDto: SignupDto) {
    const { email, password, firstName, lastName, captchaToken, company, referralCode } = signupDto;
    const normalizedEmail = email.trim().toLowerCase();

    // ✅ Verify CAPTCHA (if provided)
    if (captchaToken) {
      try {
        await this.captchaService.verifyToken(captchaToken, 'register');
      } catch (error) {
        this.logger.warn('CAPTCHA verification failed', { email });
        throw new BadRequestException('CAPTCHA verification failed. Please try again.');
      }
    }

    // ✅ Validate password strength
    if (!this.isPasswordStrong(password)) {
      throw new BadRequestException(
        'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
      );
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password with Argon2id (OWASP 2025 recommended)
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        // SECURITY FIX: Only allow safe roles for self-registration
        role: PlatformRole.USER,
      },
      include: {
        memberships: { where: { isActive: true }, include: { organization: true }, take: 1 },
      },
    });

    // V2: userQuota removed

    // If company name provided at registration, create a brand for the user
    if (company && company.trim()) {
      try {
        const slugBase = company.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50) || 'brand';
        const slug = `${slugBase}-${crypto.randomBytes(4).toString('hex')}`;
        const org = await this.prisma.organization.create({
          data: {
            name: company.trim(),
            slug,
            plan: 'FREE',
          },
        });
        await this.prisma.organizationMember.create({
          data: { userId: user.id, organizationId: org.id, role: 'OWNER' },
        });
      } catch (err) {
        // Non-blocking: brand creation failure should not block signup
        this.logger.warn('Failed to create brand from company at signup', { userId: user.id, company, error: err });
      }
    }

    // ✅ Record referral if referralCode provided
    if (referralCode && referralCode.trim()) {
      try {
        await this.referralService.recordReferral({ userId: user.id, referralCode: referralCode.trim() });
        this.logger.log('Referral recorded successfully', { userId: user.id, referralCode });
      } catch (referralError) {
        // Non-blocking: referral recording failure should not block signup
        this.logger.warn('Failed to record referral during signup', {
          error: referralError instanceof Error ? referralError.message : 'Unknown error',
          userId: user.id,
          referralCode,
        });
      }
    }

    // Generate tokens
    const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

    // Save refresh token
    await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);

    // ✅ Generate email verification token and send email
    // Skip email in test mode to avoid BullMQ blocking
    if (this.configService.get<string>('SKIP_EMAIL_VERIFICATION') !== 'true') {
      try {
        const verificationToken = await this.jwtService.signAsync(
          { sub: user.id, email: user.email, type: 'email-verification' },
          {
            secret: this.configService.get('jwt.secret'),
            expiresIn: '24h', // 24 hours expiration
          },
        );

        const appUrl = this.configService.get('app.frontendUrl') || this.configService.get<string>('FRONTEND_URL') || (this.configService.get<string>('NODE_ENV') === 'production' ? 'https://luneo.app' : 'http://localhost:3000');
        const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;

        // Queue email asynchronously - don't await to not block signup response
        this.emailService.queueConfirmationEmail(
          user.email,
          verificationToken,
          verificationUrl,
          { userId: user.id, priority: 'high' },
        ).then(({ jobId }) => {
          this.logger.debug(`Confirmation email queued for ${user.email}, jobId: ${jobId}`);
        }).catch(queueError => {
          this.logger.warn('Failed to queue verification email', {
            error: queueError instanceof Error ? queueError.message : 'Unknown error',
            userId: user.id,
          });
        });
      } catch (emailError) {
        // Log error but don't block signup
        this.logger.warn('Failed to prepare verification email during signup', {
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
          userId: user.id,
        });
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.memberships?.[0]?.organizationId ?? null,
        organization: user.memberships?.[0]?.organization ?? null,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto, ip?: string) {
    const { email, password } = loginDto;
    const normalizedEmail = email.trim().toLowerCase();
    const clientIp = ip || 'unknown';

    // Protection brute force avec fail-open (timeouts intégrés dans le service)
    // Le service gère les erreurs Redis et les timeouts de manière transparente
    await this.bruteForceService.checkAndThrow(normalizedEmail, clientIp);

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: { where: { isActive: true }, include: { organization: true }, take: 1 },
      },
    });

    if (!user || !user.passwordHash) {
      // Enregistrer tentative échouée (fail-safe, n'échoue pas si Redis a des problèmes)
      await this.bruteForceService.recordFailedAttempt(normalizedEmail, clientIp);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password (supports both bcrypt legacy and Argon2id)
    const { isValid: isPasswordValid, needsRehash } = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      // Enregistrer tentative échouée (fail-safe)
      await this.bruteForceService.recordFailedAttempt(normalizedEmail, clientIp);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Progressive migration: re-hash bcrypt passwords to Argon2id on successful login
    if (needsRehash) {
      const newHash = await hashPassword(password);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
      this.logger.log(`Migrated password hash to Argon2id for user ${user.id}`);
    }

    // Email verification enforcement (configurable via REQUIRE_EMAIL_VERIFICATION)
    const requireEmailVerification = this.configService.get<string>('REQUIRE_EMAIL_VERIFICATION') !== 'false';
    if (requireEmailVerification && !user.emailVerified) {
      // Grace period: allow login if account created < 24h ago (gives time to verify)
      const gracePeriodMs = 24 * 60 * 60 * 1000; // 24 hours
      const accountAge = Date.now() - new Date(user.createdAt).getTime();
      if (accountAge > gracePeriodMs) {
        // Reset brute force counter since password was correct
        await this.bruteForceService.resetAttempts(normalizedEmail, clientIp);
        throw new UnauthorizedException(
          'Email not verified. Please check your inbox and verify your email before logging in.',
        );
      }
    }

    // Si 2FA activé, retourner token temporaire
    if (user.twoFactorEnabled) {
      const tempToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, type: 'temp-2fa' },
        {
          secret: this.configService.get('jwt.secret'),
          expiresIn: '5m', // 5 minutes pour compléter 2FA
        },
      );

      // Réinitialiser tentatives brute force après succès (fail-safe)
      await this.bruteForceService.resetAttempts(normalizedEmail, clientIp);

      return {
        requires2FA: true,
        tempToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    }

    // Réinitialiser tentatives brute force après succès (fail-safe)
    await this.bruteForceService.resetAttempts(normalizedEmail, clientIp);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

    // Save refresh token
    await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);

    // Admin roles: 2FA recommandé — si non activé, inclure un flag dans la réponse
    // mais ne PAS bloquer la connexion (le dashboard affichera un prompt de setup)
    const needs2FASetup = user.role === PlatformRole.ADMIN && !user.twoFactorEnabled;

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.memberships?.[0]?.organizationId ?? null,
        organization: user.memberships?.[0]?.organization ?? null,
      },
      ...tokens,
      ...(needs2FASetup ? { requires2FASetup: true } : {}),
    };
  }

  /**
   * Login avec 2FA (deuxième étape)
   */
  async loginWith2FA(login2FADto: Login2FADto, ip?: string) {
    const { tempToken, token } = login2FADto;

    // SECURITY FIX: Rate-limit 2FA attempts to prevent brute-force on 6-digit codes
    // Use tempToken hash + IP as identifier (5 attempts per 15-minute window)
    const twoFaIdentifier = `2fa:${tempToken.slice(-10)}`;
    const clientIp = ip || 'unknown';
    await this.bruteForceService.checkAndThrow(twoFaIdentifier, clientIp);

    try {
      // Vérifier token temporaire
      const payload = await this.jwtService.verifyAsync(tempToken, {
        secret: this.configService.get('jwt.secret'),
      });

      if (payload.type !== 'temp-2fa') {
        throw new BadRequestException('Invalid token type');
      }

      // Trouver utilisateur
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          memberships: { where: { isActive: true }, include: { organization: true }, take: 1 },
        },
      });

      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new UnauthorizedException('2FA not enabled for this user');
      }

      const userMeta = (user.metadata as Record<string, unknown>) || {};
      const backupCodes = (userMeta.backupCodes as string[]) || [];

      // SEC: Decrypt twoFactorSecret (stored encrypted via EncryptionService)
      let decryptedSecret: string;
      try {
        decryptedSecret = this.encryptionService.isEncrypted(user.twoFactorSecret)
          ? this.encryptionService.decrypt(user.twoFactorSecret)
          : user.twoFactorSecret;
      } catch {
        this.logger.error('Failed to decrypt 2FA secret', { userId: user.id });
        throw new UnauthorizedException('2FA verification failed');
      }

      const isValid = this.twoFactorService.verifyToken(decryptedSecret, token);
      if (!isValid) {
        // Vérifier codes de backup (SEC-07: codes hashés, stockés dans metadata)
        if (backupCodes.length > 0) {
          const backupResult = await this.twoFactorService.validateBackupCode(backupCodes, token);
          if (backupResult.isValid && backupResult.matchedIndex !== null) {
            const remainingCodes = backupCodes.filter((_, index) => index !== backupResult.matchedIndex);
            await this.prisma.user.update({
              where: { id: user.id },
              data: {
                metadata: { ...userMeta, backupCodes: remainingCodes },
              },
            });
          } else {
            await this.bruteForceService.recordFailedAttempt(twoFaIdentifier, clientIp);
            throw new UnauthorizedException('Invalid 2FA code');
          }
        } else {
          await this.bruteForceService.recordFailedAttempt(twoFaIdentifier, clientIp);
          throw new UnauthorizedException('Invalid 2FA code');
        }
      }

      // 2FA succeeded - reset brute force counter
      await this.bruteForceService.resetAttempts(twoFaIdentifier, clientIp);

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate tokens
      const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

      // Save refresh token
      await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.memberships?.[0]?.organizationId ?? null,
          organization: user.memberships?.[0]?.organization ?? null,
        },
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Login with 2FA failed (invalid or expired temp token): ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new UnauthorizedException('Invalid or expired temporary token');
    }
  }

  /**
   * Setup 2FA - Génère secret et QR code
   */
  async setup2FA(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Générer secret
    const { secret, otpauthUrl } = this.twoFactorService.generateSecret(user.email);

    // Générer QR code
    const qrCodeUrl = await this.twoFactorService.generateQRCode(otpauthUrl);

    // Générer codes de backup (SEC-07: hasher pour stockage)
    const { plaintextCodes, hashedCodes } = await this.twoFactorService.generateBackupCodes(10);

    // Sauvegarder secret temporairement et codes hashés dans metadata (pas encore activé)
    const existingMeta = (user.metadata as Record<string, unknown>) || {};
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        metadata: { ...existingMeta, temp2FASecret: secret, backupCodes: hashedCodes },
      },
    });

    return {
      secret,
      qrCodeUrl,
      backupCodes: plaintextCodes, // Afficher une seule fois à l'utilisateur (plaintext)
    };
  }

  /**
   * Vérifier et activer 2FA
   */
  async verifyAndEnable2FA(userId: string, verify2FADto: Verify2FADto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const userMeta = (user?.metadata as Record<string, unknown>) || {};
    const tempSecret = userMeta.temp2FASecret as string | undefined;

    if (!user || !tempSecret) {
      throw new BadRequestException('2FA setup not initiated');
    }

    // Vérifier code
    const isValid = this.twoFactorService.verifyToken(tempSecret, verify2FADto.token);
    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    const { temp2FASecret: _, ...cleanMeta } = userMeta;
    const encryptedSecret = this.encryptionService.encrypt(tempSecret);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        metadata: cleanMeta as Prisma.InputJsonValue,
      },
    });

    return {
      message: '2FA enabled successfully',
      backupCodes: (userMeta.backupCodes as string[]) || [],
    };
  }

  /**
   * Désactiver 2FA
   */
  async disable2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const userMeta = (user?.metadata as Record<string, unknown>) || {};
    const { temp2FASecret: _, backupCodes: __, ...cleanMeta } = userMeta;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        metadata: cleanMeta as Prisma.InputJsonValue,
      },
    });

    return { message: '2FA disabled successfully' };
  }

  /**
   * Verify that the given password matches the user's password (for GDPR delete-account etc.).
   */
  async verifyUserPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) return false;
    const { isValid } = await verifyPassword(password, user.passwordHash);
    return isValid;
  }

  /**
   * Get onboarding status for the current user (from brand.settings or defaults).
   */
  async getOnboardingStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { memberships: { where: { isActive: true }, include: { organization: true }, take: 1 } },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const org = user.memberships?.[0]?.organization;
    const onboardingData = (org?.onboardingData as Record<string, unknown>) || {};
    const onboardingStatus = (onboardingData.onboardingStatus as Record<string, unknown>) || {};
    const completed = onboardingStatus.completed === true;
    const welcomeCompleted = onboardingStatus.welcome_completed === true;
    const profileCompleted = onboardingStatus.profile_completed === true;
    const preferencesCompleted = onboardingStatus.preferences_completed === true;
    let currentStep: 'welcome' | 'profile' | 'preferences' | 'complete' = 'welcome';
    if (completed) currentStep = 'complete';
    else if (preferencesCompleted) currentStep = 'complete';
    else if (profileCompleted) currentStep = 'preferences';
    else if (welcomeCompleted) currentStep = 'profile';

    return {
      onboardingStatus,
      completed,
      currentStep,
    };
  }

  /**
   * Complete an onboarding step and update user/brand and onboarding status.
   */
  async completeOnboardingStep(
    userId: string,
    step: 'welcome' | 'profile' | 'preferences' | 'complete',
    data?: Record<string, unknown>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { memberships: { where: { isActive: true }, include: { organization: true }, take: 1 } },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let brandId = user.memberships?.[0]?.organizationId;
    let onboardingDataObj: Record<string, unknown> = (user.memberships?.[0]?.organization?.onboardingData as Record<string, unknown>) || {};
    let onboardingStatus: Record<string, unknown> = (typeof onboardingDataObj.onboardingStatus === 'object' && onboardingDataObj.onboardingStatus !== null ? onboardingDataObj.onboardingStatus : {}) as Record<string, unknown>;

    switch (step) {
      case 'welcome':
        onboardingStatus = { ...onboardingStatus, welcome_completed: true };
        break;
      case 'profile': {
        const name = (data?.name as string) || '';
        const company = (data?.company as string) || '';
        if (!name.trim() || !company.trim()) {
          throw new BadRequestException('Name and company are required for profile step');
        }
        const firstName = name.split(/\s+/)[0] || name;
        const lastName = name.split(/\s+/).slice(1).join(' ') || undefined;
        await this.prisma.user.update({
          where: { id: userId },
          data: { firstName, lastName },
        });
        const slugBase = company.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50) || 'brand';
        const slug = `${slugBase}-${crypto.randomBytes(4).toString('hex')}`;
        if (!brandId) {
          const brand = await this.prisma.organization.create({
            data: {
              name: company,
              slug,
              plan: 'FREE',
            },
          });
          brandId = brand.id;
          await this.prisma.organizationMember.create({
            data: { userId, organizationId: brand.id, role: 'OWNER' },
          });
          onboardingDataObj = {};
        } else {
          await this.prisma.organization.update({
            where: { id: brandId },
            data: {
              name: company,
              // companyName: company, // V1 field removed
              ...(data?.phone ? { phone: String(data.phone) } : {}),
            },
          });
        }
        onboardingStatus = { ...(onboardingStatus as Record<string, unknown>), profile_completed: true };
        break;
      }
      case 'preferences':
        onboardingStatus = { ...(onboardingStatus as Record<string, unknown>), preferences_completed: true };
        if (data && Object.keys(data).length > 0) {
          onboardingDataObj = { ...onboardingDataObj, preferences: data };
        }
        break;
      case 'complete':
        onboardingStatus = {
          ...(onboardingStatus as Record<string, unknown>),
          completed: true,
          completed_at: new Date().toISOString(),
        };
        break;
      default:
        throw new BadRequestException(`Invalid onboarding step: ${step}`);
    }

    onboardingDataObj.onboardingStatus = onboardingStatus;

    if (brandId) {
      await this.prisma.organization.update({
        where: { id: brandId },
        data: {
          onboardingData: onboardingDataObj as Prisma.InputJsonValue,
          onboardingCompleted: onboardingStatus.completed === true,
        },
      });
    }

    return {
      profile: { onboardingStatus, ...(brandId && { brandId }) },
      onboardingStatus,
      completed: onboardingStatus.completed === true,
    };
  }

  /**
   * SEC-08: Rotation des refresh tokens avec détection de réutilisation
   * Delegates to TokenService
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    return this.tokenService.refreshToken(refreshTokenDto, metadata);
  }

  /**
   * SEC-09: Logout — revoke OAuth provider tokens, then clear refresh tokens.
   */
  async logout(userId: string) {
    // SEC-09: Best-effort revocation of OAuth provider tokens
    await this.oauthService.revokeProviderTokens(userId);
    return this.tokenService.logout(userId);
  }

  async generateTokens(userId: string, email: string, role: PlatformRole) {
    return this.tokenService.generateTokens(userId, email, role);
  }

  /**
   * SEC-08: Sauvegarde du refresh token avec gestion de famille
   * Delegates to TokenService
   */
  async saveRefreshToken(
    userId: string,
    token: string,
    family?: string,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    return this.tokenService.saveRefreshToken(userId, token, family, metadata);
  }

  /**
   * SEC-08: Nettoie les tokens expirés et révoqués (à appeler périodiquement)
   * Delegates to TokenService
   */
  async cleanupExpiredTokens() {
    return this.tokenService.cleanupExpiredTokens();
  }

  /**
   * Forgot password - Send reset email
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists (security best practice)
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Generate reset token (JWT with short expiration)
    const resetToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: 'password-reset' },
      {
        secret: this.configService.get('jwt.secret'),
        expiresIn: '1h', // 1 hour expiration
      },
    );

    // Get app URL from config
    const appUrl = this.configService.get('app.frontendUrl') || this.configService.get<string>('FRONTEND_URL') || this.configService.get<string>('NEXT_PUBLIC_APP_URL') || (this.configService.get<string>('NODE_ENV') === 'production' ? 'https://luneo.app' : 'http://localhost:3000');
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    // Queue reset email asynchronously - don't await to not block response
    this.emailService.queuePasswordResetEmail(
      user.email,
      resetToken,
      resetUrl,
      { userId: user.id, priority: 'high' },
    ).then(({ jobId }) => {
      this.logger.debug(`Password reset email queued for ${user.email}, jobId: ${jobId}`);
    }).catch(error => {
      // Log error but don't reveal it to user
      this.logger.error('Failed to queue password reset email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: user.email,
      });
    });

    // Return success message immediately (don't reveal if user exists)
    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  /**
   * Reset password - Validate token and update password
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    try {
      // Verify reset token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.secret'),
      });

      // Check token type
      if (payload.type !== 'password-reset') {
        this.logger.warn('Invalid token type for password reset', { tokenType: payload.type });
        throw new BadRequestException('Invalid token type');
      }

      // SECURITY FIX P0-3: Ensure reset token is single-use.
      // We use the token's iat (issued-at) timestamp to check if the user's password
      // was already changed after this token was issued. If passwordChangedAt > iat,
      // the token has already been used or is stale.
      const tokenIssuedAt = payload.iat ? new Date(payload.iat * 1000) : null;

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        this.logger.warn('User not found for password reset', { userId: payload.sub });
        throw new NotFoundException('User not found');
      }

      // SECURITY FIX P0-3: Check if password was already changed after this token was issued.
      // updatedAt changes when password is updated, making the token effectively single-use.
      if (tokenIssuedAt && user.updatedAt && user.updatedAt > tokenIssuedAt) {
        this.logger.warn('Reset token already used (password changed after token issued)', {
          userId: user.id,
          tokenIssuedAt: tokenIssuedAt.toISOString(),
          userUpdatedAt: user.updatedAt.toISOString(),
        });
        throw new BadRequestException('This reset link has already been used. Please request a new one.');
      }

      // ✅ Validate password strength (additional check)
      if (!this.isPasswordStrong(password)) {
        throw new BadRequestException(
          'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
        );
      }

      // Prevent reusing old password (supports both bcrypt and Argon2id)
      const { isValid: isSamePassword } = await verifyPassword(password, user.passwordHash ?? '');
      if (isSamePassword) {
        throw new BadRequestException('New password must be different from the current password');
      }

      // Hash new password with Argon2id (OWASP 2025 recommended)
      const hashedPassword = await hashPassword(password);

      // Update password
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      });

      // SECURITY FIX: Blacklist access tokens immediately + delete all refresh tokens
      await this.tokenBlacklist.blacklistUser(user.id);
      await this.prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      this.logger.log('Password reset successful', { userId: user.id, email: user.email });

      return { message: 'Password reset successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      // JWT verification errors
      this.logger.error('Password reset failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  /**
   * ✅ Validate password strength
   * Minimum requirements:
   * - 8+ characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   */
  private isPasswordStrong(password: string): boolean {
    if (password.length < 8) {
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  }

  /**
   * Verify email - Validate token and mark email as verified
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { token } = verifyEmailDto;

    try {
      // Verify email token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.secret'),
      });

      // Check token type
      if (payload.type !== 'email-verification') {
        this.logger.warn('Invalid token type for email verification', { tokenType: payload.type });
        throw new BadRequestException('Invalid token type');
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        this.logger.warn('User not found for email verification', { userId: payload.sub });
        throw new NotFoundException('User not found');
      }

      // Check if already verified
      if (user.emailVerified) {
        this.logger.log('Email already verified', { userId: user.id, email: user.email });
        return { message: 'Email already verified', verified: true };
      }

      // Mark email as verified
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });

      this.logger.log('Email verified successfully', { userId: user.id, email: user.email });

      // Send welcome email after successful verification (non-blocking)
      const userName = user.firstName || user.email.split('@')[0];
      this.emailService.queueWelcomeEmail(user.email, userName).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to queue welcome email for ${user.email}: ${msg}`);
      });

      return { message: 'Email verified successfully', verified: true };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      // JWT verification errors
      this.logger.error('Email verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new BadRequestException('Invalid or expired verification token');
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success for security (don't leak user existence)
    if (!user) {
      return { message: 'If the email exists, a verification link has been sent.' };
    }

    if (user.emailVerified) {
      return { message: 'Email already verified.' };
    }

    try {
      const verificationToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, type: 'email-verification' },
        {
          secret: this.configService.get('jwt.secret'),
          expiresIn: '24h',
        },
      );

      const appUrl = this.configService.get('app.frontendUrl') || this.configService.get<string>('FRONTEND_URL') || (this.configService.get<string>('NODE_ENV') === 'production' ? 'https://luneo.app' : 'http://localhost:3000');
      const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;

      this.emailService.queueConfirmationEmail(
        user.email,
        verificationToken,
        verificationUrl,
        { userId: user.id, priority: 'high' },
      ).catch((err: unknown) => {
        this.logger.error('Failed to queue resend verification email', {
          userId: user.id,
          error: err instanceof Error ? err.message : String(err),
        });
      });

      this.logger.log('Verification email resent', { userId: user.id, email: user.email });
    } catch (error) {
      this.logger.error('Failed to resend verification email', {
        email,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return { message: 'If the email exists, a verification link has been sent.' };
  }

  /**
   * Find or create OAuth user
   * Delegates to OAuthService to avoid duplication
   */
  async findOrCreateOAuthUser(oauthData: {
    provider: string;
    providerId: string;
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
    accessToken: string;
    refreshToken?: string;
  }) {
    // Map to OAuthUser interface expected by OAuthService
    return this.oauthService.findOrCreateOAuthUser({
      provider: oauthData.provider as 'google' | 'github' | 'saml' | 'oidc',
      providerId: oauthData.providerId,
      email: oauthData.email,
      firstName: oauthData.firstName,
      lastName: oauthData.lastName,
      picture: oauthData.picture,
      accessToken: oauthData.accessToken,
      refreshToken: oauthData.refreshToken,
    });
  }

  /**
   * Get current user profile with organization, industry, and onboarding status.
   * Used by GET /auth/me.
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            organization: true,
          },
          take: 1,
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const org = user.memberships?.[0]?.organization;
    const onboardingCompleted = org?.onboardingCompleted ?? false;
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar ?? undefined,
      role: user.role,
      organizationId: user.memberships?.[0]?.organizationId ?? null,
      isActive: user.deletedAt === null,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      phone: user.phone ?? undefined,
      timezone: user.timezone ?? 'Europe/Paris',
      locale: user.locale ?? undefined,
      brand: user.memberships?.[0]?.organization
        ? {
            id: user.memberships[0].organization.id,
            name: user.memberships[0].organization.name,
            logo: user.memberships[0].organization.logo,
            website: user.memberships[0].organization.website,
          }
        : null,
      organization: org
        ? {
            id: org.id,
            name: org.name,
            slug: org.slug,
            industry: org.industry,
            onboardingCompleted: org.onboardingCompleted,
            size: org.size,
          }
        : null,
      onboardingCompleted,
    };
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { memberships: { where: { isActive: true }, include: { organization: true }, take: 1 } },
    });
  }

  /**
   * Create user from SSO (SAML/OIDC)
   */
  async createUserFromSSO(data: {
    email: string;
    firstName: string;
    lastName: string;
    provider: string;
    providerId: string;
    emailVerified?: boolean;
  }) {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        emailVerified: data.emailVerified ?? true,
        role: PlatformRole.USER,
      },
      include: {
        memberships: { where: { isActive: true }, include: { organization: true }, take: 1 },
      },
    });

    // V2: userQuota removed

    return user;
  }

  /**
   * Update user from SSO
   */
  async updateUserFromSSO(userId: string, data: {
    firstName?: string;
    lastName?: string;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        lastLoginAt: new Date(),
      },
      include: {
        memberships: { where: { isActive: true }, include: { organization: true }, take: 1 },
      },
    });
  }

  /**
   * Link OAuth account to user
   * SEC-05: Chiffre les tokens OAuth avant stockage
   */
  async linkOAuthAccount(userId: string, data: {
    provider: string;
    providerId: string;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: Date | null;
  }) {
    // SEC-05: Chiffrer les tokens avant stockage
    const encryptedAccessToken = data.accessToken ? this.encryptOAuthToken(data.accessToken) : null;
    const encryptedRefreshToken = data.refreshToken ? this.encryptOAuthToken(data.refreshToken) : null;

    return this.prisma.oAuthAccount.upsert({
      where: {
        provider_providerId: {
          provider: data.provider,
          providerId: data.providerId,
        },
      },
      create: {
        provider: data.provider,
        providerId: data.providerId,
        userId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: data.expiresAt,
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: data.expiresAt,
      },
    });
  }
}
