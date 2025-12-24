import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string, currentUser: CurrentUser) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        brandId: true,
        createdAt: true,
        updatedAt: true,
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        userQuota: {
          select: {
            id: true,
            monthlyLimit: true,
            monthlyUsed: true,
            costLimitCents: true,
            costUsedCents: true,
            resetAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check permissions
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('Access denied');
    }

    return user;
  }

  async updateProfile(userId: string, updateData: UpdateProfileDto) {
    const { firstName, lastName, avatar } = updateData;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        avatar,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        brandId: true,
        createdAt: true,
        updatedAt: true,
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        userQuota: {
          select: {
            id: true,
            monthlyLimit: true,
            monthlyUsed: true,
            costLimitCents: true,
            costUsedCents: true,
            resetAt: true,
          },
        },
      },
    });
  }

  async getUserQuota(userId: string) {
    const quota = await this.prisma.userQuota.findUnique({
      where: { userId },
    });

    if (!quota) {
      throw new NotFoundException('User quota not found');
    }

    return quota;
  }

  async resetUserQuota(userId: string) {
    return this.prisma.userQuota.update({
      where: { userId },
      data: {
        monthlyUsed: 0,
        costUsedCents: 0,
        resetAt: new Date(),
      },
    });
  }
}
