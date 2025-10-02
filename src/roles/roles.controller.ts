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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiResponse } from '@/common/helpers/api-response.helper';
import { RolesQueryDto } from './dto/roles-query.dto';

@Controller('api/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    await this.rolesService.create(createRoleDto);
    return ApiResponse.success('Role berhasil dibuat');
  }

  @Get()
  async findAll(@Query() query: RolesQueryDto) {
    const result = await this.rolesService.findAll(query);
    return ApiResponse.successWithPaginate(
      'Data role berhasil diambil',
      result.data,
      result.meta,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.rolesService.findOne(+id);
    return ApiResponse.successWithData('Data role berhasil diambil', result);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    await this.rolesService.update(+id, updateRoleDto);
    return ApiResponse.success('Data role berhasil diperbarui');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.rolesService.remove(+id);
    return ApiResponse.success('Data role berhasil dihapus');
  }
}
