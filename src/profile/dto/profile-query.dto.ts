import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export class ProfileQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Status pengguna',
    default: 'active',
  })
  @IsOptional()
  @IsEnum(Status, {
    each: true, // 3. Validasi setiap item di dalam array
    message: `Status harus berisi salah satu dari: ${Object.values(Status).join(', ')}`,
  })
  @Transform(({ value }) => {
    // 1. Transformasi string comma-separated menjadi array
    if (typeof value === 'string') {
      return value.split(',');
    }
    return value;
  })
  status?: Status[];
}
