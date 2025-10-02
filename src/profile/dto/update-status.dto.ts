import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({ enum: Status, enumName: 'Status' })
  @IsEnum(Status, {
    message: 'status harus salah satu: active, pending, inactive',
  })
  status: Status;
}
