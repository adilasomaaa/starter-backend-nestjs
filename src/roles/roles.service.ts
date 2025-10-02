import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { RolesQueryDto } from './dto/roles-query.dto';
import { Role } from '@prisma/client';

type RoleWithPermissions = Role & {
  rolePermissions: {
    permission: {
      name: string;
    };
  }[];
};

@Injectable()
export class RolesService {
  constructor(private prismaService: PrismaService) {}

  private _transformRole(role: RoleWithPermissions) {
    const { rolePermissions, ...roleWithoutPermissions } = role;
    const permissions = rolePermissions.map((rp) => rp.permission.name);
    return { ...roleWithoutPermissions, permissions };
  }

  async create(createRoleDto: CreateRoleDto) {
    const { name, permissions } = createRoleDto;

    const existingRole = await this.prismaService.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      throw new ConflictException('Role dengan nama tersebut sudah ada.');
    }

    return this.prismaService.$transaction(async (prisma) => {
      const role = await prisma.role.create({
        data: { name },
      });

      if (permissions && permissions.length > 0) {
        const foundPermissions = await prisma.permission.findMany({
          where: {
            id: {
              in: permissions,
            },
          },
        });

        if (!foundPermissions) {
          throw new NotFoundException('Tidak ada permission yang ditemukan.');
        }

        if (foundPermissions.length !== permissions.length) {
          throw new NotFoundException('Tidak semua permission ditemukan.');
        }

        const rolePermissionsData = foundPermissions.map((perm) => ({
          roleId: role.id,
          permissionId: perm.id,
        }));

        await prisma.rolePermission.createMany({
          data: rolePermissionsData,
        });
      }

      return role;
    });
  }

  async findAll(query: RolesQueryDto) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [roles, total] = await this.prismaService.$transaction([
      this.prismaService.role.findMany({
        skip,
        take: limit,
        orderBy: { id: 'asc' },
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      }),
      this.prismaService.role.count(),
    ]);

    const transformedRoles = roles.map((role) => this._transformRole(role));

    return {
      data: transformedRoles,
      meta: {
        page,
        limit,
        totalData: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const role = await this.prismaService.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) {
      return null;
    }

    return this._transformRole(role);
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    const { name, permissions } = updateRoleDto;
    return this.prismaService.$transaction(async (prisma) => {
      const role = await prisma.role.update({
        where: { id },
        data: { name },
      });

      if (permissions) {
        await prisma.rolePermission.deleteMany({
          where: { roleId: id },
        });

        if (permissions.length > 0) {
          const foundPermissions = await prisma.permission.findMany({
            where: {
              id: {
                in: permissions,
              },
            },
          });

          if (foundPermissions.length !== permissions.length) {
            throw new NotFoundException('Tidak semua permission ditemukan.');
          }

          const rolePermissionsData = foundPermissions.map((perm) => ({
            roleId: role.id,
            permissionId: perm.id,
          }));

          await prisma.rolePermission.createMany({
            data: rolePermissionsData,
          });
        }
      }

      return role;
    });
  }

  async remove(id: number) {
    const role = await this.prismaService.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role tidak ditemukan.');
    }

    await this.prismaService.role.delete({
      where: { id },
    });
  }
}
