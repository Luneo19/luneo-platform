import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { SupportService } from './support.service';
import { TicketsService } from './services/tickets.service';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/types/user.types';
import { Request as ExpressRequest } from 'express';
import { TicketStatus, TicketPriority, TicketCategory } from '@prisma/client';

/**
 * Support Controller - Enterprise Grade
 * RESTful API for support tickets and knowledge base
 * Inspired by: Zendesk API, Intercom API, Linear API
 */
@ApiTags('support')
@Controller('support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly ticketsService: TicketsService,
    private readonly knowledgeBaseService: KnowledgeBaseService
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get support dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  async getDashboard(@ExpressRequest() req: ExpressRequest & { user: CurrentUser }) {
    return this.supportService.getDashboard(req.user);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Get tickets with filters' })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TicketPriority })
  @ApiQuery({ name: 'category', required: false, enum: TicketCategory })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Tickets retrieved' })
  async getTickets(
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('category') category?: TicketCategory,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @ExpressRequest() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.ticketsService.getTickets(
      {
        status,
        priority,
        category,
        search,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      },
      req.user
    );
  }

  @Get('tickets/stats')
  @ApiOperation({ summary: 'Get ticket statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getTicketStats(@ExpressRequest() req: ExpressRequest & { user: CurrentUser }) {
    return this.ticketsService.getTicketStats(req.user);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get a single ticket' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved' })
  async getTicket(
    @Param('id') id: string,
    @ExpressRequest() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.ticketsService.getTicket(id, req.user);
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  async createTicket(
    @Body() dto: CreateTicketDto,
    @ExpressRequest() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.ticketsService.createTicket(dto, req.user);
  }

  @Patch('tickets/:id')
  @ApiOperation({ summary: 'Update a ticket' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket updated' })
  async updateTicket(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @ExpressRequest() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.ticketsService.updateTicket(id, dto, req.user);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Add a message to a ticket' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 201, description: 'Message added' })
  async addMessage(
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
    @ExpressRequest() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.ticketsService.addMessage(id, dto, req.user);
  }

  @Get('knowledge-base/articles')
  @ApiOperation({ summary: 'Get knowledge base articles' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Articles retrieved' })
  async getArticles(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.knowledgeBaseService.getArticles({
      category,
      search,
      featured: featured === 'true',
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('knowledge-base/articles/:slug')
  @ApiOperation({ summary: 'Get a knowledge base article by slug' })
  @ApiParam({ name: 'slug', description: 'Article slug' })
  @ApiResponse({ status: 200, description: 'Article retrieved' })
  async getArticle(@Param('slug') slug: string) {
    return this.knowledgeBaseService.getArticle(slug);
  }

  @Get('knowledge-base/categories')
  @ApiOperation({ summary: 'Get article categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved' })
  async getCategories() {
    return this.knowledgeBaseService.getCategories();
  }
}

