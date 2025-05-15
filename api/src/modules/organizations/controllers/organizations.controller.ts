import { Controller, Get, Post, Body, Param, Put, Delete, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from '../services/organizations.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { Tenant } from '../../../common/tenant/decorators/tenant.decorator';

@ApiTags('organizations')
@Controller('organizations')
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all organizations accessible to the current tenant' })
  findAll(@Tenant() tenantId: string) {
    return this.organizationsService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an organization by ID' })
  findOne(@Param('id') id: string, @Tenant() tenantId: string) {
    return this.organizationsService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  create(@Body() createOrganizationDto: CreateOrganizationDto, @Request() req) {
    return this.organizationsService.create(createOrganizationDto, req.user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an organization' })
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: Partial<CreateOrganizationDto>,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Post(':id/members/:userId')
  @ApiOperation({ summary: 'Add a member to an organization' })
  addMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('role') role?: string,
  ) {
    return this.organizationsService.addMember(id, userId, role);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from an organization' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.organizationsService.removeMember(id, userId);
  }
}