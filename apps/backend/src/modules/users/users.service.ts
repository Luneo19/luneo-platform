import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string, currentUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        brand: true,
        userQuota: true,
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

  async updateProfile(userId: string, updateData: any) {
    const { firstName, lastName, avatar } = updateData;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        avatar,
      },
      include: {
        brand: true,
        userQuota: true,
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
