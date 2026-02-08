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
import { Setup2FADto } from './dto/setup-2fa.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { Login2FADto } from './dto/login-2fa.dto';
import { UserRole, Prisma } from '@prisma/client';
import { BruteForceService } from './services/brute-force.service';
import { TwoFactorService } from './services/two-factor.service';
import { CaptchaService } from './services/captcha.service';
import { TokenService } from './services/token.service';
import { OAuthService } from './services/oauth.service';
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
    const { email, password, firstName, lastName, role, captchaToken } = signupDto;

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
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password with Argon2id (OWASP 2025 recommended)
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || UserRole.CONSUMER,
      },
      include: {
        brand: true,
      },
    });

    // Create user quota
    await this.prisma.userQuota.create({
      data: {
        userId: user.id,
      },
    });

    // Generate tokens
    const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

    // Save refresh token
    await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);

    // ✅ Generate email verification token and send email
    // Skip email in test mode to avoid BullMQ blocking
    if (process.env.SKIP_EMAIL_VERIFICATION !== 'true') {
      try {
        const verificationToken = await this.jwtService.signAsync(
          { sub: user.id, email: user.email, type: 'email-verification' },
          {
            secret: this.configService.get('jwt.secret'),
            expiresIn: '24h', // 24 hours expiration
          },
        );

        const appUrl = this.configService.get('app.frontendUrl') || process.env.FRONTEND_URL || 'http://localhost:3000';
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
        brandId: user.brandId,
        brand: user.brand,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto, ip?: string) {
    const { email, password } = loginDto;
    const clientIp = ip || 'unknown';

    // Protection brute force avec fail-open (timeouts intégrés dans le service)
    // Le service gère les erreurs Redis et les timeouts de manière transparente
    await this.bruteForceService.checkAndThrow(email, clientIp);

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        brand: true,
      },
    });

    if (!user || !user.password) {
      // Enregistrer tentative échouée (fail-safe, n'échoue pas si Redis a des problèmes)
      await this.bruteForceService.recordFailedAttempt(email, clientIp);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password (supports both bcrypt legacy and Argon2id)
    const { isValid: isPasswordValid, needsRehash } = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      // Enregistrer tentative échouée (fail-safe)
      await this.bruteForceService.recordFailedAttempt(email, clientIp);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Progressive migration: re-hash bcrypt passwords to Argon2id on successful login
    if (needsRehash) {
      const newHash = await hashPassword(password);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: newHash },
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
        await this.bruteForceService.resetAttempts(email, clientIp);
        throw new UnauthorizedException(
          'Email not verified. Please check your inbox and verify your email before logging in.',
        );
      }
    }

    // Si 2FA activé, retourner token temporaire
    if (user.is2FAEnabled) {
      const tempToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, type: 'temp-2fa' },
        {
          secret: this.configService.get('jwt.secret'),
          expiresIn: '5m', // 5 minutes pour compléter 2FA
        },
      );

      // Réinitialiser tentatives brute force après succès (fail-safe)
      await this.bruteForceService.resetAttempts(email, clientIp);

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
    await this.bruteForceService.resetAttempts(email, clientIp);

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
        brandId: user.brandId,
        brand: user.brand,
      },
      ...tokens,
    };
  }

  /**
   * Login avec 2FA (deuxième étape)
   */
  async loginWith2FA(login2FADto: Login2FADto, ip?: string) {
    const { tempToken, token } = login2FADto;

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
          brand: true,
        },
      });

      if (!user || !user.is2FAEnabled || !user.twoFASecret) {
        throw new UnauthorizedException('2FA not enabled for this user');
      }

      // Vérifier code 2FA
      const isValid = this.twoFactorService.verifyToken(user.twoFASecret, token);
      if (!isValid) {
        // Vérifier codes de backup (SEC-07: codes hashés)
        if (user.backupCodes.length > 0) {
          const backupResult = await this.twoFactorService.validateBackupCode(user.backupCodes, token);
          if (backupResult.isValid && backupResult.matchedIndex !== null) {
            // Retirer le code de backup utilisé (par son index dans la liste hashée)
            const remainingCodes = user.backupCodes.filter((_, index) => index !== backupResult.matchedIndex);
            await this.prisma.user.update({
              where: { id: user.id },
              data: {
                backupCodes: {
                  set: remainingCodes,
                },
              },
            });
          } else {
            throw new UnauthorizedException('Invalid 2FA code');
          }
        } else {
          throw new UnauthorizedException('Invalid 2FA code');
        }
      }

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
          brandId: user.brandId,
          brand: user.brand,
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

    // Sauvegarder secret temporairement et codes hashés (pas encore activé)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        temp2FASecret: secret,
        backupCodes: hashedCodes, // Stocker les codes hashés
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

    if (!user || !user.temp2FASecret) {
      throw new BadRequestException('2FA setup not initiated');
    }

    // Vérifier code
    const isValid = this.twoFactorService.verifyToken(user.temp2FASecret, verify2FADto.token);
    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Activer 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        is2FAEnabled: true,
        twoFASecret: user.temp2FASecret,
        temp2FASecret: null,
      },
    });

    return {
      message: '2FA enabled successfully',
      backupCodes: user.backupCodes,
    };
  }

  /**
   * Désactiver 2FA
   */
  async disable2FA(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        is2FAEnabled: false,
        twoFASecret: null,
        temp2FASecret: null,
        backupCodes: [],
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
      select: { password: true },
    });
    if (!user?.password) return false;
    const { isValid } = await verifyPassword(password, user.password);
    return isValid;
  }

  /**
   * Get onboarding status for the current user (from brand.settings or defaults).
   */
  async getOnboardingStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { brand: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const settings = (user.brand?.settings as Record<string, unknown>) || {};
    const onboardingStatus = (settings.onboardingStatus as Record<string, unknown>) || {};
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
      include: { brand: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let brandId = user.brandId;
    let settings: Record<string, unknown> = (user.brand?.settings as Record<string, unknown>) || {};
    let onboardingStatus: Record<string, unknown> = (settings.onboardingStatus as Record<string, unknown>) || {};

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
          const brand = await this.prisma.brand.create({
            data: {
              name: company,
              slug,
              companyName: company,
              users: { connect: { id: userId } },
            },
          });
          brandId = brand.id;
          await this.prisma.user.update({
            where: { id: userId },
            data: { brandId },
          });
          settings = {};
        } else {
          await this.prisma.brand.update({
            where: { id: brandId },
            data: {
              name: company,
              companyName: company,
              ...(data?.phone && { phone: String(data.phone) }),
            },
          });
        }
        onboardingStatus = { ...onboardingStatus, profile_completed: true };
        break;
      }
      case 'preferences':
        onboardingStatus = { ...onboardingStatus, preferences_completed: true };
        if (data && Object.keys(data).length > 0) {
          settings = { ...settings, preferences: data };
        }
        break;
      case 'complete':
        onboardingStatus = {
          ...onboardingStatus,
          completed: true,
          completed_at: new Date().toISOString(),
        };
        break;
      default:
        throw new BadRequestException(`Invalid onboarding step: ${step}`);
    }

    settings.onboardingStatus = onboardingStatus;

    if (brandId) {
      await this.prisma.brand.update({
        where: { id: brandId },
        data: { settings: settings as Prisma.InputJsonValue },
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
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    return this.tokenService.refreshToken(refreshTokenDto);
  }

  async logout(userId: string) {
    return this.tokenService.logout(userId);
  }

  async generateTokens(userId: string, email: string, role: UserRole) {
    return this.tokenService.generateTokens(userId, email, role);
  }

  /**
   * SEC-08: Sauvegarde du refresh token avec gestion de famille
   * Delegates to TokenService
   */
  async saveRefreshToken(userId: string, token: string, family?: string) {
    return this.tokenService.saveRefreshToken(userId, token, family);
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
    const appUrl = this.configService.get('app.frontendUrl') || process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        this.logger.warn('User not found for password reset', { userId: payload.sub });
        throw new NotFoundException('User not found');
      }

      // ✅ Validate password strength (additional check)
      if (!this.isPasswordStrong(password)) {
        throw new BadRequestException(
          'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
        );
      }

      // Prevent reusing old password (supports both bcrypt and Argon2id)
      const { isValid: isSamePassword } = await verifyPassword(password, user.password);
      if (isSamePassword) {
        throw new BadRequestException('New password must be different from the current password');
      }

      // Hash new password with Argon2id (OWASP 2025 recommended)
      const hashedPassword = await hashPassword(password);

      // Update password
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Delete all refresh tokens for security (force re-login)
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
        brand: {
          include: {
            organization: {
              include: { industry: true },
            },
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const org = user.brand?.organization;
    const industry = org?.industry ?? null;
    const onboardingCompleted = org?.onboardingCompletedAt != null;
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      brandId: user.brandId,
      brand: user.brand
        ? {
            id: user.brand.id,
            name: user.brand.name,
            logo: user.brand.logo,
            website: user.brand.website,
          }
        : null,
      organization: org
        ? {
            id: org.id,
            name: org.name,
            slug: org.slug,
            industryId: org.industryId,
            onboardingCompletedAt: org.onboardingCompletedAt,
            companySize: org.companySize,
            primaryUseCase: org.primaryUseCase,
          }
        : null,
      industry: industry
        ? {
            id: industry.id,
            slug: industry.slug,
            labelFr: industry.labelFr,
            labelEn: industry.labelEn,
            icon: industry.icon,
            accentColor: industry.accentColor,
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
      include: { brand: true },
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
        role: UserRole.CONSUMER,
      },
      include: {
        brand: true,
      },
    });

    // Create user quota
    await this.prisma.userQuota.create({
      data: {
        userId: user.id,
      },
    });

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
        brand: true,
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
        expiresAt: data.expiresAt,
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: data.expiresAt,
      },
    });
  }
}
