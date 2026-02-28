import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, LeadStatus, ChurnRisk } from '@prisma/client';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { CurrentUser } from '@/common/types/user.types';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactProfileDto } from './dto/update-contact-profile.dto';
import { ContactQueryDto } from './dto/contact-query.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async list(query: ContactQueryDto, user: CurrentUser) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContactWhereInput = {
      organizationId: user.organizationId,
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string, user: CurrentUser) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');

    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        conversations: {
          orderBy: { updatedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            channelType: true,
            createdAt: true,
            updatedAt: true,
            satisfactionRating: true,
          },
        },
      },
    });

    if (!contact) throw new NotFoundException('Contact introuvable');
    return contact;
  }

  async create(dto: CreateContactDto, user: CurrentUser) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Au moins un identifiant contact (email ou phone) est requis');
    }

    return this.prisma.contact.create({
      data: {
        organizationId: user.organizationId,
        externalId: dto.externalId,
        email: dto.email,
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        aiProfile: dto.aiProfile as Prisma.InputJsonValue | undefined,
        leadStatus: LeadStatus.NEW,
        churnRisk: ChurnRisk.LOW,
      },
    });
  }

  async updateProfile(id: string, dto: UpdateContactProfileDto, user: CurrentUser) {
    const contact = await this.getById(id, user);

    return this.prisma.contact.update({
      where: { id: contact.id },
      data: {
        aiProfile: dto.aiProfile as Prisma.InputJsonValue | undefined,
        leadStatus: dto.leadStatus ?? undefined,
        churnRisk: dto.churnRisk ?? undefined,
        leadScore: dto.leadScore ?? undefined,
        tags: dto.tags ?? undefined,
        segments: dto.segments ?? undefined,
        firstName: dto.firstName ?? undefined,
        lastName: dto.lastName ?? undefined,
        lastInteractionAt: new Date(),
      },
    });
  }
}
