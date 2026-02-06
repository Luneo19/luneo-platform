import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
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
import { UserRole } from '@prisma/client';
import { BruteForceService } from './services/brute-force.service';
import { TwoFactorService } from './services/two-factor.service';
import { CaptchaService } from './services/captcha.service';

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

    // Hash password (13 rounds pour meilleure sécurité - OWASP recommandation)
    const hashedPassword = await bcrypt.hash(password, 13);

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
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

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

        const appUrl = this.configService.get('app.frontendUrl') || process.env.FRONTEND_URL || 'https://app.luneo.app';
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

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Enregistrer tentative échouée (fail-safe)
      await this.bruteForceService.recordFailedAttempt(email, clientIp);
      throw new UnauthorizedException('Invalid credentials');
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
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

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
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      // Save refresh token
      await this.saveRefreshToken(user.id, tokens.refreshToken);

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
   * SEC-08: Rotation des refresh tokens avec détection de réutilisation
   * 
   * Implémente le pattern "Refresh Token Rotation" recommandé par l'OWASP:
   * - Chaque refresh token ne peut être utilisé qu'une seule fois
   * - Un nouveau token est généré à chaque utilisation
   * - Si un token déjà utilisé est réutilisé, toute la famille est invalidée
   *   (indique potentiellement un vol de token)
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify refresh token JWT signature
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      // Check if token exists in database
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: {
          user: {
            include: {
              brand: true,
            },
          },
        },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // SEC-08: Détection de réutilisation de token
      // Si le token a déjà été utilisé, c'est une potentielle attaque
      // Note: Temporary type assertions until Prisma client is regenerated with new fields
      const tokenRecordAny = tokenRecord as any;
      if (tokenRecordAny.usedAt || tokenRecordAny.revokedAt) {
        this.logger.warn(
          `Refresh token reuse detected for user ${tokenRecord.userId}. ` +
          `Token family ${tokenRecordAny.family} will be invalidated. ` +
          `Potential token theft attempt.`
        );
        
        // Invalider toute la famille de tokens (sécurité)
        await this.prisma.refreshToken.updateMany({
          where: { family: tokenRecordAny.family } as any,
          data: { revokedAt: new Date() } as any,
        });
        
        throw new UnauthorizedException('Refresh token has been revoked. Please login again.');
      }

      // Vérifier expiration
      if (tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(
        tokenRecord.user.id,
        tokenRecord.user.email,
        tokenRecord.user.role,
      );

      // SEC-08: Marquer l'ancien token comme utilisé (pas supprimer, pour détecter réutilisation)
      // Note: Temporary type assertion until Prisma client is regenerated with new fields
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() } as any,
      });

      // Save new refresh token with same family
      await this.saveRefreshToken(
        tokenRecord.user.id, 
        tokens.refreshToken,
        (tokenRecord as any).family, // Conserver la famille pour traçabilité
      );

      return {
        user: {
          id: tokenRecord.user.id,
          email: tokenRecord.user.email,
          firstName: tokenRecord.user.firstName,
          lastName: tokenRecord.user.lastName,
          role: tokenRecord.user.role,
          brandId: tokenRecord.user.brandId,
          brand: tokenRecord.user.brand,
        },
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    // Delete all refresh tokens for user
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'Logged out successfully' };
  }

  async generateTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * SEC-08: Sauvegarde du refresh token avec gestion de famille
   * 
   * @param userId - ID de l'utilisateur
   * @param token - Le refresh token JWT
   * @param family - Optionnel: famille de tokens pour rotation (nouvelle famille si non fourni)
   */
  async saveRefreshToken(userId: string, token: string, family?: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
        // SEC-08: Si family fourni, utiliser la même famille (rotation)
        // Sinon, Prisma génère un nouveau cuid() (nouvelle session)
        ...(family && { family }),
      },
    });
  }

  /**
   * SEC-08: Nettoie les tokens expirés et révoqués (à appeler périodiquement)
   * Cette méthode peut être appelée par un cron job ou un scheduler
   */
  async cleanupExpiredTokens() {
    // Note: revokedAt and usedAt fields require Prisma client regeneration
    // Using type assertion until the client is updated
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } } as any,
          // Supprimer aussi les tokens utilisés de plus de 24h
          // (garde une fenêtre pour détecter les réutilisations récentes)
          {
            usedAt: { 
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000) 
            },
          } as any,
        ],
      },
    });
    
    this.logger.log(`Cleaned up ${result.count} expired/revoked refresh tokens`);
    return result.count;
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
    const appUrl = this.configService.get('app.frontendUrl') || process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.luneo.app';
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

      // ✅ Prevent reusing old password (optional but recommended)
      const isSamePassword = await bcrypt.compare(password, user.password);
      if (isSamePassword) {
        throw new BadRequestException('New password must be different from the current password');
      }

      // Hash new password (13 rounds pour meilleure sécurité - OWASP recommandation)
      const hashedPassword = await bcrypt.hash(password, 13);

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
    const { provider, providerId, email, firstName, lastName, picture, accessToken, refreshToken } = oauthData;

    // Check if OAuth account exists
    const existingOAuth = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
      include: {
        user: {
          include: {
            brand: true,
          },
        },
      },
    });

    if (existingOAuth) {
      // Update tokens
      // SEC-05: Chiffrer les tokens OAuth avant stockage
      await this.prisma.oAuthAccount.update({
        where: {
          provider_providerId: {
            provider,
            providerId,
          },
        },
        data: {
          accessToken: this.encryptOAuthToken(accessToken),
          refreshToken: this.encryptOAuthToken(refreshToken) || existingOAuth.refreshToken,
        },
      });

      // Update user last login
      await this.prisma.user.update({
        where: { id: existingOAuth.userId },
        data: { lastLoginAt: new Date() },
      });

      return existingOAuth.user;
    }

    // Check if user exists with this email
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        brand: true,
      },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          avatar: picture,
          emailVerified: true, // OAuth emails are pre-verified
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
    } else {
      // Update user info if needed
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          avatar: picture || user.avatar,
          emailVerified: true,
          lastLoginAt: new Date(),
        },
        include: {
          brand: true,
        },
      });
    }

    // Create OAuth account
    // SEC-05: Chiffrer les tokens OAuth avant stockage
    await this.prisma.oAuthAccount.upsert({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
      create: {
        provider,
        providerId,
        userId: user.id,
        accessToken: this.encryptOAuthToken(accessToken),
        refreshToken: this.encryptOAuthToken(refreshToken),
      },
      update: {
        accessToken: this.encryptOAuthToken(accessToken),
        refreshToken: this.encryptOAuthToken(refreshToken) || undefined,
      },
    });

    return user;
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
