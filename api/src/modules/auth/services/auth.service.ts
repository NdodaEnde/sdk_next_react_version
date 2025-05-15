import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  // Validate Supabase JWT token and extract user information
  async validateToken(token: string) {
    try {
      // Decode the JWT to extract the claims
      const payload = this.jwtService.decode(token);
      
      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid token');
      }

      // Check if the user exists in our database
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          organizations: {
            include: {
              organization: true,
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Return the validated user with their organizations
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        organizations: user.organizations.map(membership => ({
          id: membership.organization.id,
          name: membership.organization.name,
          role: membership.role,
          isPrimary: membership.isPrimary,
        })),
      };
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }
}