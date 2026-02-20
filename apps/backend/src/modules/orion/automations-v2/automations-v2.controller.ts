import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { AutomationsV2Service, AutomationTrigger, AutomationAction } from './automations-v2.service';
import {
  CreateAutomationV2Dto,
  UpdateAutomationV2Dto,
  TestAutomationDto,
} from '../dto/automations-v2.dto';

@ApiTags('orion-automations-v2')
@ApiBearerAuth()
@Controller('orion/automations-v2')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
export class AutomationsV2Controller {
  constructor(private readonly service: AutomationsV2Service) {}

  @Get()
  @ApiOperation({ summary: 'List automations' })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiResponse({ status: 200, description: 'Automations list' })
  getAutomations(@Query('brandId') brandId?: string) {
    return this.service.getAutomations(brandId);
  }

  @Get('triggers')
  @ApiOperation({ summary: 'Get available triggers' })
  @ApiResponse({ status: 200, description: 'Available triggers' })
  getTriggers() {
    return this.service.getAvailableTriggers();
  }

  @Get('actions')
  @ApiOperation({ summary: 'Get available actions' })
  @ApiResponse({ status: 200, description: 'Available actions' })
  getActions() {
    return this.service.getAvailableActions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get automation by ID' })
  @ApiParam({ name: 'id', description: 'Automation ID' })
  @ApiResponse({ status: 200, description: 'Automation details' })
  getAutomation(@Param('id') id: string) {
    return this.service.getAutomation(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new automation' })
  @ApiResponse({ status: 201, description: 'Automation created' })
  createAutomation(@Body() body: CreateAutomationV2Dto) {
    return this.service.createAutomation({
      ...body,
      trigger: body.trigger as unknown as AutomationTrigger,
      conditions: body.conditions as unknown as Record<string, unknown>,
      actions: body.actions as unknown as AutomationAction[],
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an automation' })
  @ApiParam({ name: 'id', description: 'Automation ID' })
  @ApiResponse({ status: 200, description: 'Automation updated' })
  updateAutomation(@Param('id') id: string, @Body() body: UpdateAutomationV2Dto) {
    return this.service.updateAutomation(id, {
      ...body,
      trigger: body.trigger as unknown as AutomationTrigger,
      conditions: body.conditions as unknown as Record<string, unknown>,
      actions: body.actions as unknown as AutomationAction[],
    });
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Toggle automation active state' })
  @ApiParam({ name: 'id', description: 'Automation ID' })
  @ApiResponse({ status: 200, description: 'Automation toggled' })
  toggleAutomation(@Param('id') id: string) {
    return this.service.toggleAutomation(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an automation' })
  @ApiParam({ name: 'id', description: 'Automation ID' })
  @ApiResponse({ status: 200, description: 'Automation deleted' })
  deleteAutomation(@Param('id') id: string) {
    return this.service.deleteAutomation(id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test an automation with sample data' })
  @ApiParam({ name: 'id', description: 'Automation ID' })
  @ApiResponse({ status: 200, description: 'Automation test result' })
  testAutomation(@Param('id') id: string, @Body() body: TestAutomationDto) {
    return this.service.testAutomation(id, body.testData);
  }

  @Get(':id/runs')
  @ApiOperation({ summary: 'Get automation run history' })
  @ApiParam({ name: 'id', description: 'Automation ID' })
  @ApiResponse({ status: 200, description: 'Automation runs' })
  getRuns(@Param('id') id: string) {
    return this.service.getRuns(id);
  }
}
