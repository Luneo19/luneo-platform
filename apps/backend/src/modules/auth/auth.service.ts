import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, firstName, lastName, role } = signupDto;

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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

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

      await this.emailService.sendConfirmationEmail(
        user.email,
        verificationToken,
        verificationUrl,
        'auto',
      );
    } catch (emailError) {
      // Log error but don't block signup
      this.logger.warn('Failed to send verification email during signup', {
        error: emailError instanceof Error ? emailError.message : 'Unknown error',
        userId: user.id,
      });
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

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        brand: true,
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
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
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify refresh token
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

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(
        tokenRecord.user.id,
        tokenRecord.user.email,
        tokenRecord.user.role,
      );

      // Delete old refresh token
      await this.prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });

      // Save new refresh token
      await this.saveRefreshToken(tokenRecord.user.id, tokens.refreshToken);

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

  private async generateTokens(userId: string, email: string, role: UserRole) {
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

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
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

    // Send reset email
    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        resetUrl,
        'auto',
      );
    } catch (error) {
      // Log error but don't reveal it to user
      this.logger.error('Failed to send password reset email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: user.email,
      });
    }

    // Return success message (don't reveal if user exists)
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

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12);

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
        data: { emailVerified: true, emailVerifiedAt: new Date() },
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
}
