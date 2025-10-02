import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'admin', description: 'role name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: [1, 2, 3], description: 'list of permission id' })
  @IsNotEmpty({ each: true })
  permissions: number[];
}
