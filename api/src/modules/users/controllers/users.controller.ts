import { Controller, Get, Param, Put, Body, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { Tenant } from '../../../common/tenant/decorators/tenant.decorator';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users in the current organization' })
  findAll(@Tenant() tenantId: string) {
    return this.usersService.findAll(tenantId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the current user profile' })
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.usersService.update(id, updateData);
  }
}