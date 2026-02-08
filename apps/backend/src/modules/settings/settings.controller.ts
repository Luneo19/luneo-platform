import { Controller, Put, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

interface JwtUser {
  id: string;
  email?: string;
  role?: string;
  brandId?: string | null;
}

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('notifications')
  @ApiOperation({ summary: 'Get current notification preferences' })
  @ApiResponse({ status: 200, description: 'Current notification preferences' })
  async getNotifications(@Req() req: { user: JwtUser }) {
    return this.settingsService.getNotificationPreferences(req.user.id);
  }

  @Put('notifications')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  async updateNotifications(
    @Req() req: { user: JwtUser },
    @Body() preferences: UpdateNotificationPreferencesDto,
  ) {
    const updated = await this.settingsService.updateNotificationPreferences(
      req.user.id,
      preferences,
    );
    return { success: true, preferences: updated };
  }
}
