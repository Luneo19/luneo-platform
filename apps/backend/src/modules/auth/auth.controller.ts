import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
  Request,
  Get,
  Res,
  Logger,
} from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { CurrentUser } from '@/common/types/user.types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { Login2FADto } from './dto/login-2fa.dto';
import { OnboardingDto } from './dto/onboarding.dto';
import { CheckPermissionDto } from './dto/check-permission.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { Public } from '@/common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { AuthCookiesHelper } from './auth-cookies.helper';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { RATE_LIMITS } from '@/common/constants/app.constants';
import { RBACService } from '@/modules/security/services/rbac.service';
import { Permission } from '@/modules/security/interfaces/rbac.interface';

/** Request type for auth endpoints: Express request with optional user, ip, cookies */
export type AuthRequest = ExpressRequest & {
  user?: CurrentUser;
  ip?: string;
  cookies?: Record<string, string>;
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly rbacService: RBACService,
  ) {}

  /** Frontend base URL for OAuth/callback redirects (config or env, production-safe fallback). */
  private getFrontendUrl(): string {
    return this.configService.get('app.frontendUrl') || process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://app.luneo.app' : 'http://localhost:3000');
  }

  @Post('signup')
  /** @Public: user registration — no auth yet */
  @Public()
  @Throttle({ default: RATE_LIMITS.AUTH.SIGNUP })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Inscription d\'un nouvel utilisateur',
    description: 'Crée un nouveau compte utilisateur. Les tokens JWT sont automatiquement définis dans des cookies httpOnly pour la sécurité. Un email de vérification est envoyé.',
  })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès. Les tokens sont définis dans des cookies httpOnly.',
    schema: {
      type: 'object',
      properties: {
        user: { type: 'object', description: 'User object' },
        success: { type: 'boolean', description: 'Operation success flag' },
      },
    },
    headers: {
      'Set-Cookie': {
        description: 'Cookies httpOnly contenant access_token et refresh_token',
        schema: {
          type: 'string',
          example: 'accessToken=...; HttpOnly; Secure; SameSite=Lax',
        },
      },
    },
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides - Vérifier le format de l\'email et la force du mot de passe',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Utilisateur déjà existant - L\'email est déjà utilisé',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'User already exists' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async signup(
    @Body() signupDto: SignupDto,
    @Res({ passthrough: false }) res: ExpressResponse,
  ) {
    const result = await this.authService.signup(signupDto);
    
    // Set httpOnly cookies
    AuthCookiesHelper.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      this.configService,
    );
    
    // Tokens are set in httpOnly cookies only — never exposed in response body
    return res.status(HttpStatus.CREATED).json({
      user: result.user,
      success: true,
    });
  }

  @Post('login')
  /** @Public: login — returns tokens/cookies */
  @Public()
  @Throttle({ default: RATE_LIMITS.AUTH.LOGIN })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Connexion utilisateur',
    description: 'Authentifie un utilisateur avec email et mot de passe. Les tokens JWT sont automatiquement définis dans des cookies httpOnly. Met à jour lastLoginAt.',
  })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie. Les tokens sont définis dans des cookies httpOnly.',
    schema: {
      type: 'object',
      properties: {
        user: { type: 'object', description: 'User object' },
        success: { type: 'boolean', description: 'Operation success flag' },
      },
    },
    headers: {
      'Set-Cookie': {
        description: 'Cookies httpOnly contenant accessToken (15min) et refreshToken (7 jours)',
        schema: {
          type: 'string',
          example: 'accessToken=...; HttpOnly; Secure; SameSite=Lax; Max-Age=900',
        },
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Identifiants invalides - Email ou mot de passe incorrect',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: AuthRequest,
    @Res({ passthrough: false }) res: ExpressResponse,
  ) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = req.ip || (Array.isArray(forwarded) ? forwarded[0] : forwarded) || 'unknown';
    const result = await this.authService.login(loginDto, ip);
    
    // Si 2FA requis, retourner tempToken sans cookies
    if ('requires2FA' in result && result.requires2FA) {
      return res.status(HttpStatus.OK).json({
        requires2FA: true,
        tempToken: result.tempToken,
        user: result.user,
      });
    }
    
    // Set httpOnly cookies
    if ('accessToken' in result && 'refreshToken' in result) {
      AuthCookiesHelper.setAuthCookies(
        res,
        result.accessToken,
        result.refreshToken,
        this.configService,
        { rememberMe: loginDto.rememberMe },
      );
      
      // Tokens are set in httpOnly cookies only — never exposed in response body
      return res.status(HttpStatus.OK).json({
        user: result.user,
        success: true,
        ...('requires2FASetup' in result && result.requires2FASetup ? { requires2FASetup: true } : {}),
      });
    }
    
    return res.status(HttpStatus.OK).json({
      user: result.user,
      success: true,
    });
  }

  @Post('login/2fa')
  @Public()
  @Throttle({ default: RATE_LIMITS.AUTH.REFRESH })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion avec code 2FA' })
  async loginWith2FA(
    @Body() login2FADto: Login2FADto,
    @Request() req: AuthRequest,
    @Res({ passthrough: false }) res: ExpressResponse,
  ) {
    const result = await this.authService.loginWith2FA(login2FADto, req.ip);
    
    // Set httpOnly cookies
    AuthCookiesHelper.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      this.configService,
    );
    
    // Tokens are set in httpOnly cookies only — never exposed in response body
    return res.status(HttpStatus.OK).json({
      user: result.user,
      success: true,
    });
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configurer l\'authentification à deux facteurs' })
  async setup2FA(@Request() req: AuthRequest) {
    return this.authService.setup2FA(req.user!.id);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifier et activer 2FA' })
  async verify2FA(@Request() req: AuthRequest, @Body() verify2FADto: Verify2FADto) {
    return this.authService.verifyAndEnable2FA(req.user!.id, verify2FADto);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Désactiver 2FA' })
  async disable2FA(@Request() req: AuthRequest) {
    return this.authService.disable2FA(req.user!.id);
  }

  @Post('refresh')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Rafraîchir le token d\'accès',
    description: 'Génère un nouveau accessToken et refreshToken à partir d\'un refreshToken valide. Le refreshToken peut être fourni dans le body ou dans un cookie httpOnly. Les nouveaux tokens sont définis dans des cookies httpOnly.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token rafraîchi avec succès. Nouveaux tokens définis dans des cookies httpOnly.',
    schema: {
      type: 'object',
      properties: {
        user: { type: 'object', description: 'User object' },
        success: { type: 'boolean', description: 'Operation success flag' },
      },
    },
    headers: {
      'Set-Cookie': {
        description: 'Nouveaux cookies httpOnly avec accessToken et refreshToken',
        schema: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Refresh token invalide, expiré ou non trouvé',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid or expired refresh token' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Request() req: AuthRequest,
    @Res({ passthrough: false }) res: ExpressResponse,
  ) {
    // Try cookie first (refresh_token scoped to this path, then legacy refreshToken), then body
    const refreshToken =
      req.cookies?.refresh_token ||
      req.cookies?.refreshToken ||
      refreshTokenDto.refreshToken;
    
    if (!refreshToken) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: 401,
        message: 'Refresh token not provided in cookie or body',
        error: 'Unauthorized',
      });
    }
    
    const result = await this.authService.refreshToken({ refreshToken });
    
    // Set new httpOnly cookies
    AuthCookiesHelper.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      this.configService,
    );
    
    // Tokens are set in httpOnly cookies only — never exposed in response body
    return res.status(HttpStatus.OK).json({
      user: result.user,
      success: true,
    });
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Déconnexion utilisateur',
    description: 'Déconnecte l\'utilisateur et supprime le refreshToken de la base de données. Les cookies httpOnly sont automatiquement effacés.',
  })
  @ApiResponse({
    status: 200,
    description: 'Déconnexion réussie. Cookies httpOnly effacés.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Logged out successfully' },
      },
    },
    headers: {
      'Set-Cookie': {
        description: 'Cookies effacés (Max-Age=0)',
        schema: {
          type: 'string',
          example: 'accessToken=; HttpOnly; Max-Age=0',
        },
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non authentifié - Token JWT manquant ou invalide',
  })
  async logout(
    @Request() req: AuthRequest,
    @Res({ passthrough: false }) res: ExpressResponse,
  ) {
    const result = await this.authService.logout(req.user!.id);
    
    // Clear httpOnly cookies
    AuthCookiesHelper.clearAuthCookies(res, this.configService);
    
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('onboarding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete onboarding step (company, industry, profile)' })
  @ApiResponse({ status: 200, description: 'Onboarding step saved' })
  @ApiResponse({ status: 400, description: 'Invalid step or missing data' })
  async onboarding(@Request() req: AuthRequest, @Body() dto: OnboardingDto) {
    return this.authService.completeOnboardingStep(req.user!.id, dto.step, dto.data);
  }

  @Get('onboarding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get onboarding status for current user' })
  @ApiResponse({ status: 200, description: 'Onboarding status and current step' })
  async getOnboarding(@Request() req: AuthRequest) {
    return this.authService.getOnboardingStatus(req.user!.id);
  }

  @Post('check-permission')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if current user has a permission' })
  @ApiResponse({ status: 200, description: 'Returns { allowed: boolean }' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkPermission(
    @Request() req: { user: { id: string } },
    @Body() dto: CheckPermissionDto,
  ) {
    const allowed = await this.rbacService.userHasPermission(req.user.id, dto.permission as Permission);
    return { allowed };
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user permissions' })
  @ApiResponse({ status: 200, description: 'Returns { permissions: string[] }' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPermissions(@Request() req: { user: { id: string } }) {
    const permissions = await this.rbacService.getUserPermissions(req.user.id);
    return { permissions: permissions as string[] };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtenir les informations de l\'utilisateur connecté' })
  @ApiResponse({
    status: 200,
    description: 'Informations utilisateur avec organization, industry et onboardingCompleted',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        role: { type: 'string' },
        brandId: { type: 'string' },
        // AUTH FIX: P3-10 - Document isActive, emailVerified, createdAt, updatedAt in response
        isActive: { type: 'boolean' },
        emailVerified: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        brand: { type: 'object' },
        organization: { type: 'object' },
        industry: { type: 'object' },
        onboardingCompleted: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getProfile(@Request() req: { user: { id: string } }) {
    return this.authService.getMe(req.user.id);
  }

  @Post('forgot-password')
  @Public()
  @Throttle({ default: RATE_LIMITS.AUTH.FORGOT_PASSWORD })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demander la réinitialisation du mot de passe' })
  @ApiResponse({
    status: 200,
    description: 'Email de réinitialisation envoyé (si l\'utilisateur existe)',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @Public()
  @Throttle({ default: RATE_LIMITS.AUTH.RESET_PASSWORD })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réinitialiser le mot de passe avec un token' })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe réinitialisé avec succès',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Token invalide ou expiré / Password does not meet requirements' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('verify-email')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifier l\'email avec un token' })
  @ApiResponse({
    status: 200,
    description: 'Email vérifié avec succès',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        verified: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Token invalide ou expiré' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renvoyer l\'email de vérification' })
  @ApiResponse({
    status: 200,
    description: 'Email de vérification renvoyé (si le compte existe)',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(dto.email);
  }

  // ========================================
  // OAUTH ENDPOINTS
  // ========================================

  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleAuth() {
    // Guard handles redirect
  }

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async googleAuthCallback(@Request() req: AuthRequest, @Res() res: ExpressResponse) {
    try {
      const user = req.user;
      
      if (!user) {
        return res.redirect(`${this.getFrontendUrl()}/login?error=oauth_failed&provider=google`);
      }

      // SECURITY FIX: Session fixation protection - regenerate session before issuing tokens
      const reqAny = req as unknown as Record<string, unknown>;
      if (reqAny.session && typeof (reqAny.session as Record<string, unknown>).regenerate === 'function') {
        await new Promise<void>((resolve) =>
          (reqAny.session as { regenerate: (cb: () => void) => void }).regenerate(() => resolve())
        );
      }

      // SECURITY FIX: Capture request metadata for session tracking
      const metadata = {
        ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      };

      // Generate tokens
      const tokens = await this.authService.generateTokens(user.id, user.email, user.role);
      
      // Save refresh token with session metadata
      await this.authService.saveRefreshToken(user.id, tokens.refreshToken, undefined, metadata);

      // Set httpOnly cookies
      AuthCookiesHelper.setAuthCookies(
        res,
        tokens.accessToken,
        tokens.refreshToken,
        this.configService,
      );

      // Redirect to frontend callback
      return res.redirect(`${this.getFrontendUrl()}/auth/callback?next=/overview`);
    } catch (error) {
      const errorCode = error instanceof UnauthorizedException ? 'oauth_unauthorized' : 'oauth_server_error';
      return res.redirect(`${this.getFrontendUrl()}/login?error=${errorCode}&provider=google`);
    }
  }

  @Get('github')
  @Public()
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub OAuth' })
  async githubAuth() {
    // Guard handles redirect
  }

  @Get('github/callback')
  /** @Public: OAuth callback — receives redirect from GitHub */
  @Public()
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async githubAuthCallback(@Request() req: AuthRequest, @Res() res: ExpressResponse) {
    try {
      const user = req.user;
      
      if (!user) {
        return res.redirect(`${this.getFrontendUrl()}/login?error=oauth_failed&provider=github`);
      }

      // SECURITY FIX: Session fixation protection - regenerate session before issuing tokens
      const reqAny = req as unknown as Record<string, unknown>;
      if (reqAny.session && typeof (reqAny.session as Record<string, unknown>).regenerate === 'function') {
        await new Promise<void>((resolve) =>
          (reqAny.session as { regenerate: (cb: () => void) => void }).regenerate(() => resolve())
        );
      }

      // SECURITY FIX: Capture request metadata for session tracking
      const metadata = {
        ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      };

      // Generate tokens
      const tokens = await this.authService.generateTokens(user.id, user.email, user.role);
      
      // Save refresh token with session metadata
      await this.authService.saveRefreshToken(user.id, tokens.refreshToken, undefined, metadata);

      // Set httpOnly cookies
      AuthCookiesHelper.setAuthCookies(
        res,
        tokens.accessToken,
        tokens.refreshToken,
        this.configService,
      );

      // Redirect to frontend callback
      return res.redirect(`${this.getFrontendUrl()}/auth/callback?next=/overview`);
    } catch (error) {
      const errorCode = error instanceof UnauthorizedException ? 'oauth_unauthorized' : 'oauth_server_error';
      return res.redirect(`${this.getFrontendUrl()}/login?error=${errorCode}&provider=github`);
    }
  }

  // ========================================
  // ENTERPRISE SSO ENDPOINTS (SAML/OIDC)
  // ========================================

  @Get('saml')
  /** @Public: SAML SSO entry — redirects to IdP */
  @Public()
  @UseGuards(AuthGuard('saml'))
  @ApiOperation({ summary: 'Initiate SAML SSO login' })
  @ApiResponse({ status: 302, description: 'Redirects to SAML IdP' })
  async samlAuth() {
    // Guard handles redirect
  }

  @Post('saml/callback')
  @Get('saml/callback')
  /** @Public: SAML callback — receives POST/GET from IdP */
  @Public()
  @UseGuards(AuthGuard('saml'))
  @ApiOperation({ summary: 'SAML SSO callback (supports both POST and GET)' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async samlAuthCallback(@Request() req: AuthRequest, @Res() res: ExpressResponse) {
    try {
      const user = req.user;
      
      if (!user) {
        return res.redirect(`${this.getFrontendUrl()}/login?error=saml_failed`);
      }

      // Generate tokens
      const tokens = await this.authService.generateTokens(user.id, user.email, user.role);
      
      // Save refresh token
      await this.authService.saveRefreshToken(user.id, tokens.refreshToken);

      // Set httpOnly cookies
      AuthCookiesHelper.setAuthCookies(
        res,
        tokens.accessToken,
        tokens.refreshToken,
        this.configService,
      );

      // Redirect to frontend callback
      return res.redirect(`${this.getFrontendUrl()}/auth/callback?next=/overview`);
    } catch (error) {
      this.logger.error('SAML callback error', { error: error instanceof Error ? error.message : String(error) });
      return res.redirect(`${this.getFrontendUrl()}/login?error=saml_server_error&provider=saml`);
    }
  }

  @Get('oidc')
  /** @Public: OIDC SSO entry — redirects to IdP */
  @Public()
  @UseGuards(AuthGuard('oidc'))
  @ApiOperation({ summary: 'Initiate OIDC SSO login' })
  @ApiResponse({ status: 302, description: 'Redirects to OIDC IdP' })
  async oidcAuth() {
    // Guard handles redirect
  }

  @Get('oidc/callback')
  /** @Public: OIDC callback — receives redirect from IdP */
  @Public()
  @UseGuards(AuthGuard('oidc'))
  @ApiOperation({ summary: 'OIDC SSO callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async oidcAuthCallback(@Request() req: AuthRequest, @Res() res: ExpressResponse) {
    try {
      const user = req.user;
      
      if (!user) {
        return res.redirect(`${this.getFrontendUrl()}/login?error=oidc_failed`);
      }

      // Generate tokens
      const tokens = await this.authService.generateTokens(user.id, user.email, user.role);
      
      // Save refresh token
      await this.authService.saveRefreshToken(user.id, tokens.refreshToken);

      // Set httpOnly cookies
      AuthCookiesHelper.setAuthCookies(
        res,
        tokens.accessToken,
        tokens.refreshToken,
        this.configService,
      );

      // Redirect to frontend callback
      return res.redirect(`${this.getFrontendUrl()}/auth/callback?next=/overview`);
    } catch (error) {
      this.logger.error('OIDC callback error', { error: error instanceof Error ? error.message : String(error) });
      return res.redirect(`${this.getFrontendUrl()}/login?error=oidc_server_error&provider=oidc`);
    }
  }
}
