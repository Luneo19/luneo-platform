import 'multer';
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import {
  normalizePagination,
  createPaginationResult,
  PaginationParams,
  PaginationResult,
} from '@/libs/prisma/pagination.helper';
import { UploadAssetDto } from '../dto/assets/upload-asset.dto';
import { AssetQueryDto } from '../dto/assets/asset-query.dto';
import { VISUAL_CUSTOMIZER_LIMITS, SUPPORTED_SYSTEM_FONTS } from '../visual-customizer.constants';
import { CurrentUser } from '@/common/types/user.types';

@Injectable()
export class CustomizerAssetsService {
  private readonly logger = new Logger(CustomizerAssetsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Upload an asset
   */
  async upload(
    file: Express.Multer.File,
    dto: UploadAssetDto,
    user: CurrentUser,
  ) {
    // Validate file size
    const maxSizeMB = VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_SIZE_MB;
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > maxSizeMB) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
      );
    }

    // Validate file type
    if (
      dto.type === 'IMAGE' &&
      !VISUAL_CUSTOMIZER_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.mimetype as any)
    ) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed for images`,
      );
    }

    if (
      dto.type === 'FONT' &&
      !VISUAL_CUSTOMIZER_LIMITS.ALLOWED_FONT_TYPES.includes(file.mimetype as any)
    ) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed for fonts`,
      );
    }

    // Upload to Cloudinary
    const folder = `brands/${user.brandId}/customizer/assets`;
    const fileKey = `${folder}/${dto.type.toLowerCase()}/${Date.now()}-${file.originalname}`;

    const url = await this.storageService.uploadBuffer(
      file.buffer,
      fileKey,
      {
        contentType: file.mimetype,
        bucket: 'luneo-assets',
      },
    );

    // Create asset record
    const asset = await this.prisma.customizerAsset.create({
      data: {
        brandId: user.brandId!,
        customizerId: dto.customizerId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        fileUrl: url,
        originalFileName: file.originalname,
        visibility: dto.visibility || 'PRIVATE',
        category: dto.category,
        tags: dto.tags || [],
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    this.logger.log(`Asset uploaded: ${asset.id} for brand ${user.brandId}`);

    return asset;
  }

  /**
   * Find all assets
   */
  async findAll(
    query: AssetQueryDto & PaginationParams,
    user: CurrentUser,
  ): Promise<PaginationResult<unknown>> {
    const { skip, take, page, limit } = normalizePagination(query);

    const where: Prisma.CustomizerAssetWhereInput = {
      brandId: user.brandId!,
      ...(query.type && { type: query.type }),
      ...(query.category && { category: query.category }),
      ...(query.customizerId && { customizerId: query.customizerId }),
      ...(query.visibility && { visibility: query.visibility }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.customizerAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.customizerAsset.count({ where }),
    ]);

    return createPaginationResult(data, total, { page, limit });
  }

  /**
   * Find one asset by ID
   */
  async findOne(id: string, user: CurrentUser) {
    const asset = await this.prisma.customizerAsset.findFirst({
      where: {
        id,
        brandId: user.brandId!,
      },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    return asset;
  }

  /**
   * Delete an asset
   */
  async delete(id: string, user: CurrentUser) {
    const asset = await this.findOne(id, user);

    // Delete from Cloudinary
    try {
      // Extract public ID from URL
      const urlParts = asset.fileUrl.split('/');
      const publicId = urlParts[urlParts.length - 1].split('.')[0];
      await this.storageService.deleteFile(publicId);
    } catch (error) {
      this.logger.warn(`Failed to delete asset from storage: ${error}`);
      // Continue with DB deletion even if storage deletion fails
    }

    // Delete from database
    await this.prisma.customizerAsset.delete({
      where: { id },
    });

    this.logger.log(`Asset deleted: ${id}`);

    return {
      success: true,
      id,
      deletedAt: new Date().toISOString(),
    };
  }

  /**
   * Get clipart categories
   */
  async getClipartCategories(user: CurrentUser) {
    const categories = await this.prisma.clipartCategory.findMany({
      where: {
        brandId: user.brandId!,
      },
      orderBy: { name: 'asc' },
    });

    return categories;
  }

  /**
   * Get clipart by category
   */
  async getClipartByCategory(
    categoryId: string,
    query: PaginationParams,
    user: CurrentUser,
  ): Promise<PaginationResult<unknown>> {
    const { skip, take, page, limit } = normalizePagination(query);

    // Verify category belongs to brand
    const category = await this.prisma.clipartCategory.findFirst({
      where: {
        id: categoryId,
        brandId: user.brandId!,
      },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException(
        `Clipart category with ID ${categoryId} not found`,
      );
    }

    const where: Prisma.CustomizerAssetWhereInput = {
      brandId: user.brandId!,
      type: 'CLIPART',
      category: categoryId,
    };

    const [data, total] = await Promise.all([
      this.prisma.customizerAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.customizerAsset.count({ where }),
    ]);

    return createPaginationResult(data, total, { page, limit });
  }

  /**
   * Get fonts for a customizer
   */
  async getFonts(customizerId: string, user: CurrentUser) {
    // Get custom fonts from assets
    const customFonts = await this.prisma.customizerAsset.findMany({
      where: {
        brandId: user.brandId!,
        customizerId,
        type: 'FONT',
        visibility: { in: ['PUBLIC', 'BRAND'] },
      },
      select: {
        id: true,
        name: true,
        fileUrl: true,
        fontFamily: true,
      },
    });

    // Combine with system fonts
    const systemFonts = SUPPORTED_SYSTEM_FONTS.map((fontName) => ({
      id: `system-${fontName.toLowerCase().replace(/\s+/g, '-')}`,
      name: fontName,
      fileUrl: null,
      fontFamily: fontName,
      isSystem: true,
    }));

    return {
      customFonts,
      systemFonts,
      allFonts: [...systemFonts, ...customFonts],
    };
  }

  /**
   * Upload a font
   */
  async uploadFont(
    file: Express.Multer.File,
    body: { name: string; fontFamily?: string; description?: string },
    user: CurrentUser,
  ) {
    // Validate file size
    const maxSizeMB = VISUAL_CUSTOMIZER_LIMITS.MAX_FONT_SIZE_MB;
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > maxSizeMB) {
      throw new BadRequestException(
        `Font size exceeds maximum allowed size of ${maxSizeMB}MB`,
      );
    }

    // Validate file type
    if (!VISUAL_CUSTOMIZER_LIMITS.ALLOWED_FONT_TYPES.includes(file.mimetype as any)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed for fonts`,
      );
    }

    // Upload to Cloudinary
    const folder = `brands/${user.brandId}/customizer/assets/fonts`;
    const fileKey = `${folder}/${Date.now()}-${file.originalname}`;

    const url = await this.storageService.uploadBuffer(
      file.buffer,
      fileKey,
      {
        contentType: file.mimetype,
        bucket: 'luneo-assets',
      },
    );

    // Extract font family name from filename if not provided
    const fontFamily =
      body.fontFamily ||
      file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    // Create asset record
    const asset = await this.prisma.customizerAsset.create({
      data: {
        brandId: user.brandId!,
        name: body.name,
        description: body.description,
        type: 'FONT',
        fileUrl: url,
        originalFileName: file.originalname,
        fontFamily,
        visibility: 'BRAND',
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    this.logger.log(`Font uploaded: ${asset.id} for brand ${user.brandId}`);

    return asset;
  }
}
