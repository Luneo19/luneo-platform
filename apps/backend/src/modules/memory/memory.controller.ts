import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RequestWithUser } from '@/common/types/user.types';
import { MemoryService } from './memory.service';
import { SummarizeConversationDto } from './dto/summarize-conversation.dto';

@ApiTags('memory')
@Controller('memory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Get('contacts/:contactId')
  @ApiOperation({ summary: 'Recuperer la memoire episodique d un contact' })
  async getContactMemory(
    @Request() req: RequestWithUser,
    @Param('contactId') contactId: string,
  ) {
    return { data: await this.memoryService.getContactMemory(req.user, contactId) };
  }

  @Post('conversations/summarize')
  @ApiOperation({ summary: 'Resumer une conversation pour memoire episodique' })
  async summarizeConversation(
    @Request() req: RequestWithUser,
    @Body() dto: SummarizeConversationDto,
  ) {
    return { data: await this.memoryService.summarizeConversation(req.user, dto.conversationId) };
  }
}
