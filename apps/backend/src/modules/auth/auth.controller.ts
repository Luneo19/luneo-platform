import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Res,
  Response,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
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
import { Setup2FADto } from './dto/setup-2fa.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { Login2FADto } from './dto/login-2fa.dto';
import { Public } from '@/common/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { AuthCookiesHelper } from './auth-cookies.helper';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  @Public()
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
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'user_123' },
                email: { type: 'string', example: 'user@example.com' },
                firstName: { type: 'string', example: 'John' },
                lastName: { type: 'string', example: 'Doe' },
                role: { type: 'string', example: 'USER' },
                emailVerified: { type: 'boolean', example: false },
              },
            },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
    headers: {
      'Set-Cookie': {
        description: 'Cookies httpOnly contenant accessToken et refreshToken',
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
    
    // Return user data (tokens are in httpOnly cookies)
    // Tokens removed from response for security (httpOnly cookies only)
    return {
      user: result.user,
    };
  }

  @Post('login')
  @Public()
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
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user_123' },
            email: { type: 'string', example: 'user@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            role: { type: 'string', example: 'USER' },
          },
        },
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
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: any,
    @Res({ passthrough: false }) res: ExpressResponse,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const result = await this.authService.login(loginDto, ip);
    
    // Si 2FA requis, retourner tempToken sans cookies
    if ('requires2FA' in result && result.requires2FA) {
      return {
        requires2FA: true,
        tempToken: result.tempToken,
        user: result.user,
      };
    }
    
    // Set httpOnly cookies
    if ('accessToken' in result && 'refreshToken' in result) {
      AuthCookiesHelper.setAuthCookies(
        res,
        result.accessToken,
        result.refreshToken,
        this.configService,
      );
    }
    
    // Return user data (tokens are in httpOnly cookies)
    return {
      user: result.user,
    };
  }

  @Post('login/2fa')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 tentatives par minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion avec code 2FA' })
  async loginWith2FA(
    @Body() login2FADto: Login2FADto,
    @Request() req: any,
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
    
    return {
      user: result.user,
    };
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configurer l\'authentification à deux facteurs' })
  async setup2FA(@Request() req: any) {
    return this.authService.setup2FA(req.user.id);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifier et activer 2FA' })
  async verify2FA(@Request() req: any, @Body() verify2FADto: Verify2FADto) {
    return this.authService.verifyAndEnable2FA(req.user.id, verify2FADto);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Désactiver 2FA' })
  async disable2FA(@Request() req: any) {
    return this.authService.disable2FA(req.user.id);
  }

  @Post('refresh')
  @Public()
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
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user_123' },
            email: { type: 'string', example: 'user@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            role: { type: 'string', example: 'USER' },
          },
        },
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
    @Request() req: any,
    @Res({ passthrough: false }) res: ExpressResponse,
  ) {
    // Try to get refresh token from cookie first, then from body
    const refreshToken = req.cookies?.refreshToken || refreshTokenDto.refreshToken;
    
    if (!refreshToken) {
      throw new Error('Refresh token not provided');
    }
    
    const result = await this.authService.refreshToken({ refreshToken });
    
    // Set new httpOnly cookies
    AuthCookiesHelper.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      this.configService,
    );
    
    // Return user data (tokens are in httpOnly cookies)
    // Tokens removed from response for security (httpOnly cookies only)
    return {
      user: result.user,
    };
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
    @Request() req: any,
    @Res({ passthrough: false }) res: ExpressResponse,
  ) {
    const result = await this.authService.logout(req.user.id);
    
    // Clear httpOnly cookies
    AuthCookiesHelper.clearAuthCookies(res, this.configService);
    
    return result;
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtenir les informations de l\'utilisateur connecté' })
  @ApiResponse({
    status: 200,
    description: 'Informations utilisateur',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
            brandId: { type: 'string' },
            brand: { type: 'object' },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getProfile(@Request() req) {
    return req.user;
  }

  @Post('forgot-password')
  @Public()
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
    // ✅ Note: Rate limiting should be applied at middleware level
    // Rate limit: 3 requests per hour per IP/email
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @Public()
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
    // ✅ Note: Rate limiting should be applied at middleware level
    // Rate limit: 5 requests per hour per IP/token
    // ✅ Password strength validation included in service
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('verify-email')
  @Public()
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
  async googleAuthCallback(@Request() req: any, @Res() res: ExpressResponse) {
    const user = req.user;
    
    if (!user) {
      const frontendUrl = this.configService.get('app.frontendUrl') || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
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
    const frontendUrl = this.configService.get('app.frontendUrl') || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/callback?next=/overview`);
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
  @Public()
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async githubAuthCallback(@Request() req: any, @Res() res: ExpressResponse) {
    const user = req.user;
    
    if (!user) {
      const frontendUrl = this.configService.get('app.frontendUrl') || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
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
    const frontendUrl = this.configService.get('app.frontendUrl') || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/callback?next=/overview`);
  }

  // ========================================
  // ENTERPRISE SSO ENDPOINTS (SAML/OIDC)
  // ========================================

  @Get('saml')
  @Public()
  @UseGuards(AuthGuard('saml'))
  @ApiOperation({ summary: 'Initiate SAML SSO login' })
  @ApiResponse({ status: 302, description: 'Redirects to SAML IdP' })
  async samlAuth() {
    // Guard handles redirect
  }

  @Post('saml/callback')
  @Get('saml/callback')
  @Public()
  @UseGuards(AuthGuard('saml'))
  @ApiOperation({ summary: 'SAML SSO callback (supports both POST and GET)' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async samlAuthCallback(@Request() req: any, @Res() res: ExpressResponse) {
    const user = req.user;
    
    if (!user) {
      const frontendUrl = this.configService.get('app.frontendUrl') || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=saml_failed`);
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
    const frontendUrl = this.configService.get('app.frontendUrl') || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/callback?next=/overview`);
  }

  @Get('oidc')
  @Public()
  @UseGuards(AuthGuard('oidc'))
  @ApiOperation({ summary: 'Initiate OIDC SSO login' })
  @ApiResponse({ status: 302, description: 'Redirects to OIDC IdP' })
  async oidcAuth() {
    // Guard handles redirect
  }

  @Get('oidc/callback')
  @Public()
  @UseGuards(AuthGuard('oidc'))
  @ApiOperation({ summary: 'OIDC SSO callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async oidcAuthCallback(@Request() req: any, @Res() res: ExpressResponse) {
    const user = req.user;
    
    if (!user) {
      const frontendUrl = this.configService.get('app.frontendUrl') || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=oidc_failed`);
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
    const frontendUrl = this.configService.get('app.frontendUrl') || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/callback?next=/overview`);
  }
}
