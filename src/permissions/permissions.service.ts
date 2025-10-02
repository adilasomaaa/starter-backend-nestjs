import { ConflictException, Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

@Injectable()
export class PermissionsService {
  constructor(private prismaService: PrismaService) {}
  async create(createPermissionDto: CreatePermissionDto) {
    const { name } = createPermissionDto;

    const existingPermission = await this.prismaService.permission.findUnique({
      where: { name },
    });

    if (existingPermission) {
      throw new ConflictException('Permission dengan nama tersebut sudah ada.');
    }

    return this.prismaService.permission.create({
      data: { name },
    });
  }

  async findAll(query: PaginationQueryDto) {
    const { page, limit, search } = query; // Destructure semua properti
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = {
        contains: search,
      };
    }

    const [permissions, total] = await this.prismaService.$transaction([
      this.prismaService.permission.findMany({
        where,
        skip,
        take: limit,
      }),

      this.prismaService.permission.count({ where }),
    ]);

    return {
      data: permissions,
      meta: {
        page,
        limit,
        totalData: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  findOne(id: number) {
    return this.prismaService.permission.findUnique({
      where: { id },
    });
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    const { name } = updatePermissionDto;

    const existingPermission = await this.prismaService.permission.findUnique({
      where: { name },
    });

    if (existingPermission && existingPermission.id !== id) {
      throw new ConflictException('Permission dengan nama tersebut sudah ada.');
    }
    return this.prismaService.permission.update({
      where: { id },
      data: { name },
    });
  }

  async remove(id: number) {
    const permission = await this.prismaService.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new ConflictException('Permission tidak ditemukan.');
    }

    await this.prismaService.permission.delete({
      where: { id },
    });
  }
}
