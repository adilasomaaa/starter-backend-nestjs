import { IsEmail, IsEnum, IsIn, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Status } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({ enum: Status, enumName: 'Status' })
  @IsEnum(Status, {
    message: 'status harus salah satu: active, pending, inactive',
  })
  status: Status;
}
