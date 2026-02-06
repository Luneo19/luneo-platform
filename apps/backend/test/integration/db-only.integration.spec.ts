/**
 * Database Only Integration Test
 * Tests just Prisma + Database connectivity
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { appConfig, databaseConfig } from '@/config/configuration';

describeIntegration('Database Only Integration', () => {
  let moduleFixture: TestingModule;
  let prisma: PrismaService;

  beforeAll(async () => {
    console.log('[TEST] Starting minimal DB module initialization...');
    
    moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig, databaseConfig],
          envFilePath: '.env.test',
        }),
        PrismaModule,
      ],
    }).compile();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    console.log('[TEST] Module initialized');
  }, 30000);

  afterAll(async () => {
    console.log('[TEST] Closing module...');
    await moduleFixture?.close();
    console.log('[TEST] Module closed');
  }, 10000);

  it('should connect to database', async () => {
    console.log('[TEST] Testing DB connection...');
    
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('[TEST] DB query result:', result);
    
    expect(result).toBeDefined();
  }, 10000);

  it('should create and read a user', async () => {
    console.log('[TEST] Testing user CRUD...');
    
    const email = `test-${Date.now()}@example.com`;
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: 'test-password-hash',
        firstName: 'Test',
        lastName: 'User',
      },
    });
    
    console.log('[TEST] User created:', user.id);
    expect(user.id).toBeDefined();
    
    // Read user
    const foundUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    
    expect(foundUser?.email).toBe(email);
    
    // Clean up
    await prisma.user.delete({ where: { id: user.id } });
    console.log('[TEST] User deleted');
  }, 10000);
});
