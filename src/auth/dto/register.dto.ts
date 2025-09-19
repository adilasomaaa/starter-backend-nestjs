import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class registerDto {
    @ApiProperty({example : 'admin@example.id', description : 'email'})
    @IsEmail()
    @IsNotEmpty()
    email : string;

    @ApiProperty({example : 'john doe', description : 'name'})
    @IsNotEmpty()
    name : string;

    @ApiProperty({example : 'johndoe', description : 'username'})
    @IsNotEmpty()
    username : string;

    @ApiProperty({example : 'password', description : 'password'})
    password : string
}