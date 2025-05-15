import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        organizations: {
          some: {
            organizationId: tenantId,
          },
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        organizations: {
          where: {
            organizationId: tenantId,
          },
          select: {
            role: true,
            isPrimary: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        organizations: {
          select: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
              },
            },
            role: true,
            isPrimary: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateData: any) {
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
      },
    });
  }
}