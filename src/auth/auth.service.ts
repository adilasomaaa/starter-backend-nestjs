import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, VerificationCode } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { EmailService } from '@/email/email.service';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async signInWithGoogle(user: any) {
    if (!user) return new Error('User not found');
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '1d',
    });

    return {
      message: 'Login successful',
      accessToken: accessToken,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };

    const checkUser = await this.prisma.user.findFirst({
      where: { id: user.id },
      include: {
        userRole: {
          include: {
            role: true,
          },
        },
      },
    });

    if (
      checkUser?.userRole[0]?.role?.name === 'client' &&
      !checkUser?.verifiedAt
    ) {
      throw new UnauthorizedException('User belum terverifikasi');
    }

    // Hapus token sebelumnya
    await this.prisma.activeToken.deleteMany({
      where: { userId: user.id },
    });

    // Buat token HANYA SEKALI
    const token = this.jwtService.sign(payload);

    await this.prisma.activeToken.create({
      data: {
        userId: user.id,
        token: token, // Simpan token yang sama
      },
    });

    return {
      status: true,
      token: token, // Kirim token yang sama
    };
  }

  async register(registerDto: any) {
    const { email, password, name, username } = registerDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    });

    // Jika sudah ada, lemparkan error 409 Conflict yang lebih ramah.
    if (existingUser) {
      throw new ConflictException('Email atau username sudah terdaftar.');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        username: registerDto.username,
        password: hashedPassword,
      },
    });

    const verificationCode = await this.generateAndSaveVerificationCode(user);

    await this.emailService.sendCodeVerification(user, verificationCode.code);

    if (user) {
      const client = await this.prisma.profile.create({
        data: {
          userId: user.id,
          name: registerDto.name,
          username: registerDto.username,
        },
      });

      const findRole = await this.prisma.role.findUnique({
        where: { name: 'client' },
      });

      if (!findRole) {
        throw new NotFoundException('Role client tidak ditemukan.');
      }

      // Tambahkan role client ke user
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: findRole.id,
        },
      });

      return client;
    }
  }

  async verifyAccount(verifyDto: any) {
    const { code, email } = verifyDto;
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Email tidak ditemukan.');
    }

    const verificationCode = await this.prisma.verificationCode.findUnique({
      where: { userId: user.id, code },
    });

    if (!verificationCode) {
      throw new BadRequestException('Kode verifikasi tidak valid.');
    }

    if (new Date() > verificationCode.expiresAt) {
      // Hapus kode yang sudah kadaluarsa
      await this.prisma.verificationCode.delete({
        where: { id: verificationCode.id },
      });
      throw new BadRequestException(
        'Kode verifikasi telah kadaluarsa. Silakan minta kode baru.',
      );
    }

    await this.prisma.user.update({
      where: { id: verificationCode.userId },
      data: { verifiedAt: new Date() },
    });

    await this.prisma.verificationCode.delete({
      where: { id: verificationCode.id },
    });

    return { message: 'Akun berhasil diverifikasi!' };
  }

  private async generateAndSaveVerificationCode(
    user: User,
  ): Promise<VerificationCode> {
    // Hapus kode lama jika ada
    await this.prisma.verificationCode.deleteMany({
      where: { userId: user.id },
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // Kode 6 digit
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Kadaluarsa dalam 10 menit

    return this.prisma.verificationCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
      },
    });
  }

  async resendVerificationCode(email: string) {
    // 1. Cari pengguna berdasarkan email
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('Pengguna dengan email ini tidak ditemukan.');
    }

    // 2. Pastikan pengguna belum terverifikasi
    if (user.verifiedAt) {
      throw new BadRequestException('Akun ini sudah terverifikasi.');
    }

    // 3. Cari kode verifikasi yang ada untuk pengguna ini
    const existingCode = await this.prisma.verificationCode.findUnique({
      where: { userId: user.id },
    });

    let newCode: string;

    if (existingCode) {
      // 4a. Jika kode sudah ada, cek batas pengiriman
      if (existingCode.sendCount >= 3) {
        throw new ForbiddenException(
          'Anda telah mencapai batas maksimal pengiriman ulang kode.',
        );
      }

      // Buat kode baru dan atur waktu kadaluarsa baru
      newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Reset timer 10 menit

      // Update kode yang ada di database
      await this.prisma.verificationCode.update({
        where: { id: existingCode.id },
        data: {
          code: newCode,
          expiresAt: expiresAt,
          sendCount: {
            increment: 1, // Tambah hitungan pengiriman
          },
        },
      });
    } else {
      // 4b. Jika tidak ada kode (mungkin sudah dihapus/kadaluarsa), buat yang baru
      const verificationCode = await this.generateAndSaveVerificationCode(user);
      newCode = verificationCode.code;
    }

    // 5. Kirim email dengan kode yang baru
    await this.emailService.sendCodeVerification(user, newCode);

    return { message: 'Kode verifikasi baru telah dikirim ke email Anda.' };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (user) {
      const { password, ...result } = user;
      const userRole = await this.prisma.userRole.findFirst({
        where: {
          userId: user.id,
        },
        select: {
          role: {
            select: {
              name: true,
              rolePermissions: {
                select: {
                  permission: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const roles = userRole
        ? {
            name: userRole.role.name,
            rolePermissions: userRole.role.rolePermissions.map(
              (rp) => rp.permission.name,
            ),
          }
        : [];
      return {
        ...result,
        roles,
      };
    }

    return null;
  }

  async logout(token: string): Promise<void> {
    await this.prisma.activeToken.deleteMany({
      where: {
        token: token,
      },
    });
  }

  async changePassword(
    id: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: id },
    });

    if (!user || !user.password) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );

    await this.prisma.user.update({
      where: { id: id },
      data: { password: hashedNewPassword },
    });
  }
}
