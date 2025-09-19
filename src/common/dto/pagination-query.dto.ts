import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Nomor halaman yang ingin ditampilkan',
        default: 1,
    })
    @IsOptional()
    @Type(() => Number) // Mengubah string query menjadi number
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiPropertyOptional({
        description: 'Jumlah data per halaman',
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit: number = 10;

    @ApiPropertyOptional({
        description: 'Kata kunci untuk pencarian berdasarkan nama atau deskripsi',
    })
    @IsOptional()
    @IsString()
    search?: string;
}