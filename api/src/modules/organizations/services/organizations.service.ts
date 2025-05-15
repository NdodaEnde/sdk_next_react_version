import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    // With RLS enabled, this will only return organizations 
    // the current tenant has access to
    return this.prisma.organization.findMany({
      where: {
        OR: [
          { id: tenantId },
          { parentId: tenantId },
        ],
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async create(createOrganizationDto: CreateOrganizationDto, userId: string) {
    // Check if slug is available
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug: createOrganizationDto.slug },
    });

    if (existingOrg) {
      throw new ConflictException(`Organization with slug '${createOrganizationDto.slug}' already exists`);
    }

    // Use the security definer function to create the organization with owner
    const result = await this.prisma.$queryRaw`
      SELECT create_organization_with_owner(
        ${createOrganizationDto.name}::text,
        ${createOrganizationDto.slug}::text,
        ${createOrganizationDto.type}::text,
        ${createOrganizationDto.parentId ? createOrganizationDto.parentId : null}::uuid,
        ${userId}::uuid,
        'owner'::text
      );
    `;

    // Extract the new organization ID from the result
    const newOrgId = result[0].create_organization_with_owner;

    // Return the created organization
    return this.prisma.organization.findUnique({
      where: { id: newOrgId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, updateData: Partial<CreateOrganizationDto>) {
    return this.prisma.organization.update({
      where: { id },
      data: updateData,
    });
  }

  async addMember(organizationId: string, userId: string, role: string = 'member') {
    return this.prisma.organizationUser.create({
      data: {
        organizationId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  async removeMember(organizationId: string, userId: string) {
    return this.prisma.organizationUser.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  }
}