/**
 * Complete Auth Integration Tests
 * Tests the full authentication workflow with proper mocks
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as request from 'supertest';

import { PrismaModule } from '@/libs/prisma/prisma.module';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CryptoModule } from '@/libs/crypto/crypto.module';

// Real Auth components
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';
import { TwoFactorService } from '@/modules/auth/services/two-factor.service';
import { CaptchaService } from '@/modules/auth/services/captcha.service';

// Services that need mocking
import { EmailService } from '@/modules/email/email.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import { BruteForceService } from '@/modules/auth/services/brute-force.service';

import { appConfig, databaseConfig, jwtConfig } from '@/config/configuration';
import { describeIntegration } from '@/common/test/integration-test.helper';

// Mock EmailService class
class MockEmailService {
  async queueConfirmationEmail() {
    return { jobId: 'mock-job-1' };
  }
  
  async queuePasswordResetEmail() {
    return { jobId: 'mock-job-2' };
  }
  
  async sendConfirmationEmail() {
    return undefined;
  }
  
  async sendPasswordResetEmail() {
    return undefined;
  }
  
  async queueEmail() {
    return { jobId: 'mock-job-3' };
  }
  
  async sendEmail() {
    return undefined;
  }
}

// Mocks instances
const mockEmailService = new MockEmailService();

const mockRedisService = {
  client: null,
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(true),
  getRedis: jest.fn().mockReturnValue(null),
  getOptimized: jest.fn().mockResolvedValue(null),
  setOptimized: jest.fn().mockResolvedValue(undefined),
};

const mockBruteForceService = {
  canAttempt: jest.fn().mockResolvedValue(true),
  recordAttempt: jest.fn().mockResolvedValue({ attempts: 1, blocked: false }),
  resetAttempts: jest.fn().mockResolvedValue(undefined),
  recordSuccess: jest.fn().mockResolvedValue(undefined),
  isBlocked: jest.fn().mockResolvedValue({ blocked: false, ttl: 0 }),
  checkAndThrow: jest.fn().mockResolvedValue(undefined),
  recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
};

describeIntegration('Auth Complete Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Ensure email is skipped
    process.env.SKIP_EMAIL_VERIFICATION = 'true';
    
    // Ensure JWT secrets are set for testing
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-minimum-32-characters!!';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key-for-testing-32chars';
    process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig, databaseConfig, jwtConfig],
          envFilePath: '.env.test',
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get('jwt.secret') || 'test-secret-minimum-32-characters!!',
            signOptions: { expiresIn: '15m' },
          }),
          inject: [ConfigService],
        }),
        PrismaModule,
        CryptoModule,
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        TwoFactorService,
        CaptchaService,
        { provide: EmailService, useValue: mockEmailService },
        { provide: RedisOptimizedService, useValue: mockRedisService },
        { provide: BruteForceService, useValue: mockBruteForceService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  }, 60000);

  afterAll(async () => {
    await app?.close();
  }, 10000);

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.userQuota.deleteMany({});
    await prisma.user.deleteMany({});
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should validate email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
      // Check for any email validation error message
      const messages = Array.isArray(response.body.message) 
        ? response.body.message 
        : [response.body.message];
      expect(messages.some((m: string) => m.toLowerCase().includes('email'))).toBe(true);
    });

    it('should validate password strength', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
    });

    it('should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'StrongPassword123!',
          firstName: 'New',
          lastName: 'User',
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should prevent duplicate email registration', async () => {
      // First signup
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'StrongPassword123!',
          firstName: 'First',
          lastName: 'User',
        });

      // Second signup with same email
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'StrongPassword123!',
          firstName: 'Second',
          lastName: 'User',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const testUser = {
        email: `login-valid-${Date.now()}@example.com`,
        password: 'StrongPassword123!',
        firstName: 'Login',
        lastName: 'Test',
      };

      // Create user
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send(testUser);

      // Clear refresh tokens from signup to avoid unique constraint error
      await prisma.refreshToken.deleteMany({});
      
      // Wait a bit to ensure different JWT timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const testUser = {
        email: `login-invalid-${Date.now()}@example.com`,
        password: 'StrongPassword123!',
        firstName: 'Login',
        lastName: 'Test',
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send(testUser);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(mockBruteForceService.recordFailedAttempt).toHaveBeenCalled();
    });

    it('should reject non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const email = `refresh-${Date.now()}@example.com`;
      
      // First signup
      const signupResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email,
          password: 'StrongPassword123!',
          firstName: 'Refresh',
          lastName: 'Test',
        });

      expect(signupResponse.status).toBe(201);
      const { refreshToken } = signupResponse.body;
      expect(refreshToken).toBeDefined();

      // Wait for different timestamp to avoid duplicate token
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Refresh token
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should accept forgot password request', async () => {
      // Create user first
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'forgot-test@example.com',
          password: 'StrongPassword123!',
          firstName: 'Forgot',
          lastName: 'Test',
        });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'forgot-test@example.com' });

      expect(response.status).toBe(200);
    });

    it('should not reveal if email exists', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      // Should return success even if email doesn't exist (security)
      expect(response.status).toBe(200);
    });
  });
});
