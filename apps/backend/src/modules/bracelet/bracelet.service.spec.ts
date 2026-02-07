/**
 * BraceletService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BraceletService } from './bracelet.service';
import { StorageService } from '@/libs/storage/storage.service';

const mockSharp = () => ({
  png: () => ({
    toBuffer: () => Promise.resolve(Buffer.from('png-data')),
  }),
});

jest.mock('sharp', () => ({ default: mockSharp }));

describe('BraceletService', () => {
  let service: BraceletService;
  let storageService: StorageService;
  const uploadBufferResolvedUrl = 'https://storage.example.com/renders/bracelet/test.png';

  const mockStorageService = {
    uploadBuffer: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockStorageService.uploadBuffer.mockResolvedValue(uploadBufferResolvedUrl);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BraceletService,
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<BraceletService>(BraceletService);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('renderBracelet', () => {
    it('should render bracelet and return renderUrl with default dimensions', async () => {
      const body = {
        text: 'Hello',
        font: 'Arial',
        fontSize: 24,
        alignment: 'center',
        position: 'center',
        color: '#000000',
        material: 'gold',
      };

      const result = await service.renderBracelet(body);

      expect(result).toBeDefined();
      expect(result.renderUrl).toBe(uploadBufferResolvedUrl);
      expect(result.width).toBe(3840);
      expect(result.height).toBe(2160);
      expect(result.format).toBe('png');
      expect(result.canvasData).toMatchObject({
        text: 'Hello',
        font: 'Arial',
        alignment: 'center',
        color: '#000000',
        material: 'gold',
      });
      expect(mockStorageService.uploadBuffer).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.stringMatching(/^renders\/bracelet\/bracelet-\d+-[\w-]+\.png$/),
        { contentType: 'image/png', bucket: 'luneo-bracelet-renders' },
      );
    });

    it('should use custom width, height and format when provided', async () => {
      const body = {
        text: 'Test',
        font: 'Arial',
        fontSize: 20,
        alignment: 'left',
        position: 'top',
        color: '#333',
        material: 'silver',
        width: 1920,
        height: 1080,
        format: 'jpg' as const,
      };

      const result = await service.renderBracelet(body);

      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
      expect(result.format).toBe('jpg');
      expect(mockStorageService.uploadBuffer).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.stringContaining('.jpg'),
        { contentType: 'image/jpg', bucket: 'luneo-bracelet-renders' },
      );
    });

    it('should fallback to gold material for unknown material', async () => {
      const body = {
        text: 'X',
        font: 'Arial',
        fontSize: 24,
        alignment: 'center',
        position: 'center',
        color: '#000',
        material: 'unknown_material',
      };

      const result = await service.renderBracelet(body);

      expect(result.canvasData.material).toBe('unknown_material');
      expect(mockStorageService.uploadBuffer).toHaveBeenCalled();
    });
  });
});
