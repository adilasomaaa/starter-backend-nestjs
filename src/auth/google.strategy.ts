import { PrismaService } from "@/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');

        if (!clientID || !clientSecret) {
            throw new Error('Google OAuth credentials not found in .env file');
        }
        super({
            clientID,
            clientSecret,
            callbackURL: 'http://localhost:3000/auth/google/callback',
            scope: ['email', 'profile'],
            passReqToCallback: true,
        });
    }

    async validate(
        _req: any,
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { id, name, emails, photos } = profile;
        const googleId = id;
        const email = emails[0].value;
        const fullName = `${name.givenName} ${name.familyName}`;
        const photoUrl = photos[0].value;

        try {
        // 1. Cari user berdasarkan googleId
        let user = await this.prisma.user.findUnique({
            where: { username: googleId },
        });

        // 2. Jika user ada, kembalikan data user
        if (user) {
            return done(null, user);
        }

        // 3. Jika user tidak ada dengan googleId, coba cari berdasarkan email
        user = await this.prisma.user.findUnique({
            where: { email },
        });
        
        // Jika ada user dengan email tersebut, tautkan akunnya
        if (user) {
            const updatedUser = await this.prisma.user.update({
                where: { email: user.email },
                data: { username: googleId }
            });
            return done(null, updatedUser);
        }

        // 4. Jika user sama sekali tidak ada, buat user baru
        const newUsername = email.split('@')[0] + Math.floor(Math.random() * 1000); // Generate username unik sederhana
        const newUser = await this.prisma.user.create({
            data: {
                email,
                username: newUsername,
                profile: {
                    create: {
                    name: fullName,
                    username: newUsername,
                    photo: photoUrl,
                    },
                },
            },
            include: {
            profile: true,
            },
        });

        done(null, newUser);
        } catch (error) {
        done(error, false);
        }
    }
}
