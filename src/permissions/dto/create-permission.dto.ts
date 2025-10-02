import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'create_user', description: 'permission name' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
