import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class MacroService {
  private readonly logger = new Logger(MacroService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMacros(brandId?: string, category?: string) {
    const where: Record<string, unknown> = { isActive: true };
    if (brandId) where.brandId = brandId;
    if (category) where.category = category;

    return this.prisma.supportMacro.findMany({
      where: where as never,
      orderBy: [{ usageCount: 'desc' }, { title: 'asc' }],
    });
  }

  async getMacro(id: string) {
    const macro = await this.prisma.supportMacro.findUnique({
      where: { id },
    });
    if (!macro) throw new NotFoundException('Macro not found');
    return macro;
  }

  async createMacro(data: {
    brandId?: string;
    title: string;
    content: string;
    category?: string;
    variables?: Record<string, string>;
  }) {
    return this.prisma.supportMacro.create({
      data: {
        brandId: data.brandId,
        title: data.title,
        content: data.content,
        category: data.category,
        variables: data.variables as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async updateMacro(
    id: string,
    data: Partial<{
      title: string;
      content: string;
      category: string;
      variables: Record<string, string>;
      isActive: boolean;
    }>,
  ) {
    return this.prisma.supportMacro.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.variables !== undefined
          ? { variables: data.variables as unknown as Prisma.InputJsonValue }
          : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  async deleteMacro(id: string) {
    return this.prisma.supportMacro.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async useMacro(id: string) {
    await this.prisma.supportMacro.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
    return this.getMacro(id);
  }

  async resolveMacroContent(
    id: string,
    variables: Record<string, string>,
  ): Promise<string> {
    const macro = await this.getMacro(id);
    let content = macro.content;

    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        value,
      );
    }

    return content;
  }

  async suggestMacros(ticketCategory: string, _ticketContent: string) {
    const macros = await this.prisma.supportMacro.findMany({
      where: {
        isActive: true,
        OR: [
          { category: ticketCategory },
          { category: null },
        ],
      },
      orderBy: { usageCount: 'desc' },
      take: 5,
    });

    return macros;
  }
}
