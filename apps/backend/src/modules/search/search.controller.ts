import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser as CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { CurrentUser } from '@/common/types/user.types';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('global')
  async globalSearch(
    @CurrentUserDecorator() user: CurrentUser,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    if (!user.organizationId) {
      return {
        conversations: [],
        contacts: [],
        knowledge: [],
        notes: [],
      };
    }
    return this.searchService.globalSearch(
      user.organizationId,
      q ?? '',
      limit ? Number(limit) : 10,
    );
  }
}
