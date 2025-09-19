import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) { // <-- Inject Reflector
        super();
    }

    canActivate(context: ExecutionContext) {
        // Cek apakah endpoint memiliki metadata @Public
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Jika isPublic bernilai true, lewati guard ini
        if (isPublic) {
            return true;
        }

        // Jika tidak, jalankan logika otentikasi JWT seperti biasa
        return super.canActivate(context);
    }
}