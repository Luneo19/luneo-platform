import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiScopeGuard } from './guards/api-scope.guard';
import { ApiPermissionGuard } from './guards/api-permission.guard';
import { ApiQuotaGuard } from './guards/api-quota.guard';
import { RequiredScope } from './decorators/required-scope.decorator';
import { RequiredPermission } from './decorators/required-permission.decorator';
import { PublicApiService } from './public-api.service';
import { PublicApiAuthContext } from './types/public-api-auth.type';
import { SendPublicMessageDto } from './dto/send-public-message.dto';

interface PublicApiRequest {
  publicApiAuth: PublicApiAuthContext;
}

@Controller('public')
@UseGuards(ApiKeyGuard, ApiScopeGuard, ApiPermissionGuard, ApiQuotaGuard)
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  @Get('conversations')
  @RequiredScope('conversations:read')
  @RequiredPermission('conversations:read')
  async listConversations(
    @Req() req: PublicApiRequest,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.publicApiService.listConversations(
      req.publicApiAuth.organizationId,
      limit,
    );
  }

  @Get('contacts')
  @RequiredScope('contacts:read')
  @RequiredPermission('contacts:read')
  async listContacts(
    @Req() req: PublicApiRequest,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.publicApiService.listContacts(
      req.publicApiAuth.organizationId,
      limit,
    );
  }

  @Post('messages')
  @RequiredScope('messages:write')
  @RequiredPermission('messages:write')
  async sendMessage(
    @Req() req: PublicApiRequest,
    @Body() body: SendPublicMessageDto,
  ) {
    return this.publicApiService.createOutboundMessage({
      organizationId: req.publicApiAuth.organizationId,
      conversationId: body.conversationId,
      content: body.content,
    });
  }
}
