import { PrismaService } from '@/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ProfileQueryDto } from './dto/profile-query.dto';
import { Prisma, Status } from '@prisma/client';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateProfileDto } from './dto/update.dto';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class ProfileService {
  constructor(private prismaService: PrismaService) {}

  async getProfiles(query: ProfileQueryDto) {
    const { page, limit, status, search } = query; // Destructure semua properti
    const skip = (page - 1) * limit;

    const where: Prisma.ProfileWhereInput = {};

    if (status && status.length > 0) {
      where.status = {
        in: status, // Prisma 'in' sudah mengharapkan array
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { user: { username: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    const [profiles, total] = await this.prismaService.$transaction([
      this.prismaService.profile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      }),

      this.prismaService.profile.count({ where }),
    ]);

    return {
      data: profiles,
      meta: {
        page,
        limit,
        totalData: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const data = await this.prismaService.profile.findUnique({
      where: { id: id },
      include: {
        user: true, // Contoh jika ingin menyertakan relasi user
      },
    });

    if (!data) {
      throw new Error('Data client tidak ditemukan.');
    }
    return data;
  }

  async updateStatus(id: number, updateStatus: UpdateStatusDto) {
    const result = await this.prismaService.profile.update({
      where: { id },
      data: { status: updateStatus.status },
    });
    return result;
  }

  async updateProfile(id: number, updateProfile: UpdateProfileDto) {
    let client = await this.findOne(id);

    if (client.username !== updateProfile.username) {
      const existingUser = await this.prismaService.user.findUnique({
        where: { username: updateProfile.username },
      });
      if (existingUser) {
        throw new BadRequestException('Username sudah digunakan.');
      }
    }

    const result = await this.prismaService.profile.update({
      where: { id },
      data: updateProfile,
    });

    await this.prismaService.user.update({
      where: { id: client.user.id },
      data: {
        username: updateProfile.username,
      },
    });

    return result;
  }

  async updatePhoto(id: number, photo: Express.Multer.File) {
    const data = await this.findOne(id);
    const oldPhotoPath = data.photo;
    const newPhotoPath = `uploads/${photo.filename}`;

    // Hapus foto lama jika bukan foto default
    if (oldPhotoPath && oldPhotoPath !== 'default.png') {
      await unlink(join(process.cwd(), 'public', oldPhotoPath)).catch((err) =>
        console.error(`Gagal menghapus foto lama: ${err.message}`),
      );
    }

    // Update path foto di database
    return this.prismaService.profile.update({
      where: { id },
      data: {
        photo: newPhotoPath,
      },
    });
  }

  async destroy(id: number) {
    const result = await this.prismaService.profile.delete({ where: { id } });
    return result;
  }
}
