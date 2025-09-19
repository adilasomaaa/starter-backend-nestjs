import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

@Injectable()
export class EmailService {
    constructor(private mailerService: MailerService) {}

    async sendCodeVerification(user: User, code: string) {
        await this.mailerService.sendMail({
            to: user.email,
            subject: 'Selamat Datang! Konfirmasi Email Anda',
            html: `
                <h1>Halo ${user.username},</h1>
                <p>Terima kasih telah mendaftar. Silakan gunakan kode di bawah ini untuk memverifikasi akun Anda:</p>
                <h2><b>${code}</b></h2>
                <p>Kode ini akan kadaluarsa dalam 10 menit.</p>
            `,
        });
    }
}
