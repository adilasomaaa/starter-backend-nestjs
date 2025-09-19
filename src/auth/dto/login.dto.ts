import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
    @ApiProperty({example : 'admin@example.id', description : 'email'})
    @IsEmail()
    @IsNotEmpty()
    email : string;

    @ApiProperty({example : 'password', description : 'password'})
    password : string
}