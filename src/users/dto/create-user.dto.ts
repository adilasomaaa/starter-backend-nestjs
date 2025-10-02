import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'admin@example.id', description: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'john doe', description: 'name' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: ['admin', 'client'], // Ubah contoh menjadi array
    description: 'Daftar peran untuk pengguna',
    type: [Number],
  })
  @IsArray() // Pastikan input adalah array
  @IsNotEmpty()
  roles: number[];
}
