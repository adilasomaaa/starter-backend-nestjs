import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { UserQueryDto } from './dto/user-query.dto';
import { Prisma, User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

type UserWithRoles = User & {
  userRole: {
    role: {
      name: string;
    };
  }[];
};

@Injectable()
export class UsersService {
  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  private _transformUsers(user: UserWithRoles) {
    const { password, ...userWithoutPassword } = user;
    const roles = user.userRole.map((ur) => ur.role.name);

    return { ...userWithoutPassword, userRole: roles };
  }

  async create(createUserDto: CreateUserDto) {
    const { roles, ...userData } = createUserDto;

    const existingUser = await this.prismaService.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          { username: createUserDto.username },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email atau username sudah terdaftar.');
    }

    const defaultPassword =
      this.configService.get<string>('PASSWORD_DEFAULT') || '12345678';

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    return this.prismaService.$transaction(async (prisma) => {
      const foundRoles = await prisma.role.findMany({
        where: {
          id: {
            in: createUserDto.roles,
          },
        },
      });

      if (foundRoles.length !== createUserDto.roles.length) {
        throw new NotFoundException('Satu atau lebih role tidak ditemukan.');
      }

      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });

      const userRolesData = foundRoles.map((role) => ({
        userId: user.id,
        roleId: role.id,
      }));

      await prisma.userRole.createMany({
        data: userRolesData,
      });
    });
  }

  async resetPassword(id: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }

    const defaultPassword =
      this.configService.get<string>('PASSWORD_DEFAULT') || '12345678';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await this.prismaService.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Password berhasil direset ke default.' };
  }

  async findAll(query: UserQueryDto) {
    const { page, limit, search } = query; // Destructure semua properti
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      userRole: {
        some: {
          role: { name: { not: 'client' } },
        },
      },
    };

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        skip,
        take: limit,
        where,
        include: {
          userRole: {
            select: { role: true },
          },
        },
      }),

      this.prismaService.user.count({ where }),
    ]);

    const formattedUsers = users.map((user) => this._transformUsers(user));

    return {
      data: formattedUsers,
      meta: {
        page,
        limit,
        totalData: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const data = await this.prismaService.user.findUnique({
      where: { id: id },
      include: {
        userRole: {
          select: { role: true },
        },
      },
    });

    if (!data) {
      throw new Error('Data client tidak ditemukan.');
    }
    return this._transformUsers(data);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { roles, ...userData } = updateUserDto;

    if (userData.email || userData.username) {
      const existingUser = await this.prismaService.user.findFirst({
        where: {
          OR: [{ email: userData.email }, { username: userData.username }],
          id: { not: id },
        },
      });

      if (existingUser) {
        throw new ConflictException(
          'Email atau username sudah digunakan oleh pengguna lain.',
        );
      }
    }

    const updatedUser = await this.prismaService.$transaction(
      async (prisma) => {
        // 5. Update data utama user
        const user = await prisma.user.update({
          where: { id },
          data: userData,
        });

        if (roles) {
          await prisma.userRole.deleteMany({
            where: { userId: id },
          });

          if (roles.length > 0) {
            const foundRoles = await prisma.role.findMany({
              where: {
                id: { in: roles },
              },
            });

            if (foundRoles.length !== roles.length) {
              throw new NotFoundException(
                'Satu atau lebih role tidak ditemukan.',
              );
            }

            const userRolesData = foundRoles.map((role) => ({
              userId: user.id,
              roleId: role.id,
            }));

            await prisma.userRole.createMany({
              data: userRolesData,
            });
          }
        }

        return user;
      },
    );
  }

  async remove(id: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }

    await this.prismaService.user.delete({
      where: { id },
    });
  }
}
