import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthService } from '../services/auth.service';
import { Public } from '../decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('validate')
  @ApiOperation({ summary: 'Validate a JWT token from Supabase' })
  async validateToken(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return { valid: false, message: 'No token provided' };
    }
    
    try {
      const user = await this.authService.validateToken(token);
      return { valid: true, user };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user profile' })
  getProfile(@Request() req) {
    return req.user;
  }
}