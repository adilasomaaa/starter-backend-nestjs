import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class RolesAndPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Ambil metadata dari handler -> class
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Kalau route tidak butuh role/permission, lolos
    if (!requiredRoles && !requiredPermissions) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) {
      // Seharusnya tidak terjadi jika AuthGuard('jwt') dipasang lebih dulu
      throw new ForbiddenException('Tidak ada user pada request.');
    }

    // Ambil user + relasi dari DB
    const userData = await this.prisma.user.findUnique({
      where: { id: user.id }, // pastikan ini memang field yang benar dari req.user
      include: {
        userRole: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!userData) {
      throw new ForbiddenException('Pengguna tidak ditemukan.');
    }

    // Kumpulkan roles & permissions user
    const roleSet = new Set(
      (userData.userRole ?? [])
        .map((ur) => ur.role?.name)
        .filter(Boolean)
        .map((r) => r.toLowerCase()),
    );

    const permissionSet = new Set(
      (userData.userRole ?? [])
        .flatMap((ur) => ur.role?.rolePermissions ?? [])
        .map((rp) => rp.permission?.name)
        .filter(Boolean)
        .map((p) => p.toLowerCase()),
    );

    // Normalisasi yang diminta dari decorator
    const needRoles = (requiredRoles ?? []).map((r) => r.toLowerCase());
    const needPerms = (requiredPermissions ?? []).map((p) => p.toLowerCase());

    // 1) Jika route minta ROLE(S): minimal salah satu harus ada (OR)
    if (needRoles.length > 0) {
      const hasAnyRole = needRoles.some((r) => roleSet.has(r));
      if (!hasAnyRole) {
        throw new ForbiddenException('Role tidak memenuhi syarat.');
      }
    }

    // 2) Jika route minta PERMISSION(S): semua harus ada (AND)
    if (needPerms.length > 0) {
      const hasAllPerms = needPerms.every((p) => permissionSet.has(p));
      if (!hasAllPerms) {
        throw new ForbiddenException('Permission tidak memenuhi syarat.');
      }
    }

    return true;
  }
}
