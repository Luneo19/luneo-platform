import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@/common/decorators/public.decorator';
import { ContactRequestDto } from './dto/contact-request.dto';
import { ContactService } from './contact.service';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit public contact form' })
  @ApiResponse({ status: 200, description: 'Contact message submitted' })
  async submitContact(@Body() dto: ContactRequestDto) {
    const result = await this.contactService.submitContactMessage(dto);
    return { success: true, ...result };
  }
}
