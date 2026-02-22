import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CustomizerAsset, CustomizerAssetVisibility } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '@/common/types/user.types';
import { UserRole } from '@prisma/client';

export const CUSTOMIZER_ASSET_KEY = 'customizerAsset';

export type RequestWithCustomizerAsset = Request & {
  user?: CurrentUser;
  [CUSTOMIZER_ASSET_KEY]?: CustomizerAsset;
};

@Injectable()
export class AssetAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCustomizerAsset>();
    const user = request.user as CurrentUser | undefined;
    const assetId = this.extractAssetId(request);

    if (!assetId) {
      throw new ForbiddenException('Asset ID is required');
    }

    const asset = await this.prisma.customizerAsset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        visibility: true,
        uploadedById: true,
        brandId: true,
        deletedAt: true,
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (asset.deletedAt) {
      throw new NotFoundException('Asset not found');
    }

    // PUBLIC assets: always accessible
    if (asset.visibility === CustomizerAssetVisibility.PUBLIC) {
      request[CUSTOMIZER_ASSET_KEY] = asset as CustomizerAsset;
      return true;
    }

    // For PRIVATE and BRAND assets, user must be authenticated
    if (!user) {
      throw new ForbiddenException('Authentication required to access this asset');
    }

    // Admin bypass
    const isAdmin =
      user.role === UserRole.PLATFORM_ADMIN ||
      (user.role as string) === 'SUPER_ADMIN';

    if (isAdmin) {
      request[CUSTOMIZER_ASSET_KEY] = asset as CustomizerAsset;
      return true;
    }

    // PRIVATE assets: only the uploader
    if (asset.visibility === CustomizerAssetVisibility.PRIVATE) {
      if (asset.uploadedById === user.id) {
        request[CUSTOMIZER_ASSET_KEY] = asset as CustomizerAsset;
        return true;
      }
      throw new ForbiddenException('Access denied: you are not the owner of this asset');
    }

    // BRAND assets: user must be part of the same brand
    if (asset.visibility === CustomizerAssetVisibility.BRAND) {
      if (user.brandId && user.brandId === asset.brandId) {
        request[CUSTOMIZER_ASSET_KEY] = asset as CustomizerAsset;
        return true;
      }

      // Check TeamMember for brand access
      if (asset.brandId) {
        const teamMember = await this.prisma.teamMember.findFirst({
          where: {
            organizationId: asset.brandId,
            userId: user.id,
            status: 'active',
          },
        });

        if (teamMember) {
          request[CUSTOMIZER_ASSET_KEY] = asset as CustomizerAsset;
          return true;
        }
      }

      throw new ForbiddenException('Access denied: you are not part of this brand');
    }

    throw new ForbiddenException('Access denied to this asset');
  }

  private extractAssetId(request: Request): string | undefined {
    return (
      request.params?.assetId ||
      request.params?.id ||
      request.body?.assetId ||
      request.body?.id
    );
  }
}
