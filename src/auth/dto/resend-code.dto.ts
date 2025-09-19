import { IsEmail, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";

export class ResendCodeDto {

    @ApiProperty({example : 'admin@example.id', description : 'email'})
    @IsEmail({}, {message : 'Alamat email tidak valid. Pastikan Anda memasukkan alamat email yang benar.'})
    @IsNotEmpty({message : 'Masukkan email terlebih dahulu'})
    email : string

}