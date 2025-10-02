import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { ApiResponse } from '@/common/helpers/api-response.helper';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

@Controller('api/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    await this.permissionsService.create(createPermissionDto);
    return ApiResponse.success('Permission berhasil dibuat');
  }

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    const result = await this.permissionsService.findAll(query);
    return ApiResponse.successWithPaginate(
      'Data permission berhasil diambil',
      result.data,
      result.meta,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const result = this.permissionsService.findOne(+id);
    return ApiResponse.successWithData(
      'Data permission berhasil diambil',
      result,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    await this.permissionsService.update(+id, updatePermissionDto);
    return ApiResponse.success('Data permission berhasil diperbarui');
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    this.permissionsService.remove(+id);
    return ApiResponse.success('Data permission berhasil dihapus');
  }
}
