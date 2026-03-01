import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RequestWithUser } from '@/common/types/user.types';
import { ContactsService } from './contacts.service';
import { ContactQueryDto } from './dto/contact-query.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactProfileDto } from './dto/update-contact-profile.dto';

@ApiTags('contacts')
@Controller('contacts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les contacts de l organisation courante' })
  async list(@Query() query: ContactQueryDto, @Request() req: RequestWithUser) {
    return { data: await this.contactsService.list(query, req.user) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Recuperer un contact' })
  async getById(@Param('id') id: string, @Request() req: RequestWithUser) {
    return { data: await this.contactsService.getById(id, req.user) };
  }

  @Post()
  @ApiOperation({ summary: 'Creer un contact' })
  async create(@Body() dto: CreateContactDto, @Request() req: RequestWithUser) {
    return { data: await this.contactsService.create(dto, req.user) };
  }

  @Patch(':id/profile')
  @ApiOperation({ summary: 'Mettre a jour le profil enrichi d un contact' })
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateContactProfileDto,
    @Request() req: RequestWithUser,
  ) {
    return { data: await this.contactsService.updateProfile(id, dto, req.user) };
  }
}
