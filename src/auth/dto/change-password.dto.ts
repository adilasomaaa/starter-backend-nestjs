import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'currentPassword', description: 'old password' })
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'newpassword', description: 'new password' })
  @IsNotEmpty()
  newPassword: string;
}
