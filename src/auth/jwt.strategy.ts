import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
        private prisma: PrismaService,
    ) {
        const jwtSecret = config.get<string>('JWT_SECRET');
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: jwtSecret,
            passReqToCallback: true,
        });
    }

    // Fungsi ini akan dieksekusi oleh Guard 'jwt'
    // Payload adalah hasil dekripsi dari token JWT
    async validate(req: Request, payload: { sub: number; email: string }) {
        // Ambil token mentah dari header
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            throw new UnauthorizedException('Token tidak ditemukan.');
        }

        // Cari token di database
        const activeSession = await this.prisma.activeToken.findFirst({
            where: { token: token },
        });
        
        if (!activeSession) {
            throw new UnauthorizedException('Sesi tidak valid atau sudah berakhir.');
        }

        // Ambil data user seperti biasa
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) {
            throw new UnauthorizedException('User tidak ditemukan.');
        }

        return user;
    }
}