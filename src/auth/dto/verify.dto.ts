import { IsEmail, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";

export class VerifyDto {
    @ApiProperty({example : '008800', description : 'verify code'})
    @IsNotEmpty({message : 'Masukkan kode terlebih dahulu'})
    @Length(6, 6, {message : 'Kode harus terdiri dari 6 karakter'})
    code : string;

    @ApiProperty({example : 'admin@example.id', description : 'email'})
    @IsEmail({}, {message : 'Alamat email tidak valid. Pastikan Anda memasukkan alamat email yang benar.'})
    @IsNotEmpty({message : 'Masukkan email terlebih dahulu'})
    email : string

}