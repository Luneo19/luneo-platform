/**
 * SSOService unit tests (Enterprise SSO/SAML/OIDC)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SSOService, SAMLConfigData, OIDCConfigData } from '../services/sso.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('SSOService', () => {
  let service: SSOService;
  let _prisma: PrismaService;
  let _configService: ConfigService;

  const mockPrisma = {
    brand: { findUnique: jest.fn() },
    sSOConfiguration: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'ENCRYPTION_KEY' || key === 'app.encryptionKey') return 'test-encryption-key-32-chars-long!!';
      return undefined;
    }),
  };

  const validSAMLData: SAMLConfigData = {
    brandId: 'brand-1',
    name: 'Acme SAML',
    samlEntryPoint: 'https://idp.example.com/sso',
    samlIssuer: 'https://luneo.app/saml',
    samlCert: '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----',
    samlCallbackUrl: 'https://luneo.app/auth/saml/callback',
  };

  const validOIDCData: OIDCConfigData = {
    brandId: 'brand-1',
    name: 'Acme OIDC',
    oidcIssuer: 'https://auth.example.com',
    oidcClientId: 'client-id',
    oidcClientSecret: 'client-secret',
    oidcCallbackUrl: 'https://luneo.app/auth/oidc/callback',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'ENCRYPTION_KEY' || key === 'app.encryptionKey') return 'test-encryption-key-32-chars-long!!';
      return undefined;
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SSOService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SSOService>(SSOService);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSAMLConfig', () => {
    it('should throw BadRequestException when brandId empty', async () => {
      await expect(
        service.createSAMLConfig({ ...validSAMLData, brandId: '' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createSAMLConfig({ ...validSAMLData, brandId: '' }),
      ).rejects.toThrow(/Brand ID is required/);
      expect(mockPrisma.sSOConfiguration.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when brand not found', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      await expect(service.createSAMLConfig(validSAMLData)).rejects.toThrow(NotFoundException);
      await expect(service.createSAMLConfig(validSAMLData)).rejects.toThrow(/Brand .* not found/);
      expect(mockPrisma.sSOConfiguration.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when SAML already exists for brand', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({ id: 'brand-1' });
      mockPrisma.sSOConfiguration.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.createSAMLConfig(validSAMLData)).rejects.toThrow(BadRequestException);
      await expect(service.createSAMLConfig(validSAMLData)).rejects.toThrow(
        /SAML configuration already exists/,
      );
      expect(mockPrisma.sSOConfiguration.create).not.toHaveBeenCalled();
    });

    it('should create SAML config when brand exists and no existing config', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({ id: 'brand-1' });
      mockPrisma.sSOConfiguration.findFirst.mockResolvedValue(null);
      const created = {
        id: 'sso-1',
        brandId: 'brand-1',
        provider: 'saml',
        name: validSAMLData.name,
        enabled: true,
        samlEntryPoint: validSAMLData.samlEntryPoint,
        samlIssuer: validSAMLData.samlIssuer,
        samlCert: validSAMLData.samlCert,
        samlCallbackUrl: validSAMLData.samlCallbackUrl,
        autoProvisioning: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.sSOConfiguration.create.mockResolvedValue(created);

      const result = await service.createSAMLConfig(validSAMLData);

      expect(result.brandId).toBe('brand-1');
      expect(result.provider).toBe('saml');
      expect(result.name).toBe(validSAMLData.name);
      expect(mockPrisma.sSOConfiguration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            brandId: 'brand-1',
            provider: 'saml',
            name: validSAMLData.name.trim(),
            samlEntryPoint: validSAMLData.samlEntryPoint.trim(),
          }),
        }),
      );
    });
  });

  describe('createOIDCConfig', () => {
    it('should throw BadRequestException when oidcClientSecret missing', async () => {
      await expect(
        service.createOIDCConfig({ ...validOIDCData, oidcClientSecret: '' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.sSOConfiguration.create).not.toHaveBeenCalled();
    });

    it('should create OIDC config when brand exists and no existing config', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({ id: 'brand-1' });
      mockPrisma.sSOConfiguration.findFirst.mockResolvedValue(null);
      const created = {
        id: 'sso-2',
        brandId: 'brand-1',
        provider: 'oidc',
        name: validOIDCData.name,
        enabled: true,
        oidcIssuer: validOIDCData.oidcIssuer,
        oidcClientId: validOIDCData.oidcClientId,
        oidcCallbackUrl: validOIDCData.oidcCallbackUrl,
        autoProvisioning: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.sSOConfiguration.create.mockResolvedValue(created);

      const result = await service.createOIDCConfig(validOIDCData);

      expect(result.provider).toBe('oidc');
      expect(mockPrisma.sSOConfiguration.create).toHaveBeenCalled();
    });
  });

  describe('getSSOConfig', () => {
    it('should throw BadRequestException when brandId empty', async () => {
      await expect(service.getSSOConfig('', 'saml')).rejects.toThrow(BadRequestException);
      await expect(service.getSSOConfig('  ', 'oidc')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when config not found', async () => {
      mockPrisma.sSOConfiguration.findFirst.mockResolvedValue(null);

      await expect(service.getSSOConfig('brand-1', 'saml')).rejects.toThrow(NotFoundException);
      await expect(service.getSSOConfig('brand-1', 'saml')).rejects.toThrow(
        /SSO configuration not found/,
      );
    });

    it('should return config when found', async () => {
      const config = {
        id: 'sso-1',
        brandId: 'brand-1',
        provider: 'saml' as const,
        name: 'Acme',
        enabled: true,
        samlEntryPoint: 'https://idp.example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.sSOConfiguration.findFirst.mockResolvedValue(config);

      const result = await service.getSSOConfig('brand-1', 'saml');

      expect(result).toEqual(config);
      expect(mockPrisma.sSOConfiguration.findFirst).toHaveBeenCalledWith({
        where: { brandId: 'brand-1', provider: 'saml', enabled: true },
      });
    });
  });

  describe('initiateSAML', () => {
    it('should throw BadRequestException when brandId empty', async () => {
      await expect(service.initiateSAML('')).rejects.toThrow(BadRequestException);
    });

    it('should return login URL when SAML config exists', async () => {
      const config = {
        id: 'sso-1',
        brandId: 'brand-1',
        provider: 'saml' as const,
        name: 'Acme',
        enabled: true,
        samlEntryPoint: 'https://idp.example.com/sso',
        samlIssuer: 'https://luneo.app',
        samlCallbackUrl: 'https://luneo.app/auth/saml/callback',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.sSOConfiguration.findFirst.mockResolvedValue(config);

      const url = await service.initiateSAML('brand-1');

      expect(url).toContain('https://idp.example.com/sso');
      expect(url).toContain('SAMLRequest=');
    });
  });
});
