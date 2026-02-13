import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { SearchService, SearchResults } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { CurrentUser } from '@/common/types/user.types';

@ApiTags('search')
@Controller('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Global search across products, designs, orders' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({
    name: 'types',
    required: false,
    type: String,
    description: 'Comma-separated: products, designs, orders',
  })
  async search(
    @Request() req: ExpressRequest,
    @Query() dto: SearchQueryDto,
  ): Promise<SearchResults> {
    const user = req.user as CurrentUser;
    return this.searchService.search(user, dto.q, dto.types);
  }
}
