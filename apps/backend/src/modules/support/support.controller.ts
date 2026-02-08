import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateSupportTicketDto, UpdateSupportTicketDto } from './dto/support.dto';
import { AddTicketMessageDto } from './dto/add-message.dto';
import { GetTicketsQueryDto } from './dto/get-tickets-query.dto';
import { GetKnowledgeBaseArticlesQueryDto } from './dto/get-knowledge-base-articles-query.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('support')
@Controller('support')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'Lister les tickets de support de l\'utilisateur' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Liste des tickets' })
  async getTickets(
    @Request() req,
    @Query() query: GetTicketsQueryDto,
  ) {
    return this.supportService.getTickets(req.user.id, {
      status: query.status,
      category: query.category,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Obtenir un ticket spécifique' })
  @ApiParam({ name: 'id', description: 'ID du ticket' })
  @ApiResponse({ status: 200, description: 'Détails du ticket' })
  async getTicket(@Param('id') id: string, @Request() req) {
    return this.supportService.getTicket(id, req.user.id);
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Créer un nouveau ticket de support' })
  @ApiResponse({ status: 201, description: 'Ticket créé' })
  async createTicket(@Body() createDto: CreateSupportTicketDto, @Request() req) {
    return this.supportService.createTicket({
      ...createDto,
      userId: req.user.id,
    });
  }

  @Put('tickets/:id')
  @ApiOperation({ summary: 'Mettre à jour un ticket' })
  @ApiParam({ name: 'id', description: 'ID du ticket' })
  @ApiResponse({ status: 200, description: 'Ticket mis à jour' })
  async updateTicket(@Param('id') id: string, @Body() updateDto: UpdateSupportTicketDto, @Request() req) {
    return this.supportService.updateTicket(id, updateDto, req.user.id);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Ajouter un message à un ticket' })
  @ApiParam({ name: 'id', description: 'ID du ticket' })
  @ApiResponse({ status: 201, description: 'Message ajouté' })
  async addMessageToTicket(
    @Param('id') ticketId: string,
    @Body() dto: AddTicketMessageDto,
    @Request() req,
  ) {
    return this.supportService.addMessageToTicket(ticketId, req.user.id, dto.content);
  }

  @Get('knowledge-base/articles')
  @ApiOperation({ summary: 'Lister les articles de la base de connaissances' })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Liste des articles' })
  async getKnowledgeBaseArticles(
    @Query() query: GetKnowledgeBaseArticlesQueryDto,
  ) {
    return this.supportService.getKnowledgeBaseArticles({
      category: query.category,
      search: query.search,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('knowledge-base/articles/:slug')
  @ApiOperation({ summary: 'Obtenir un article de la base de connaissances' })
  @ApiParam({ name: 'slug', description: 'Slug de l\'article' })
  @ApiResponse({ status: 200, description: 'Détails de l\'article' })
  async getKnowledgeBaseArticle(@Param('slug') slug: string) {
    return this.supportService.getKnowledgeBaseArticle(slug);
  }
}
