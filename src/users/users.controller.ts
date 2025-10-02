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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiResponse } from '@/common/helpers/api-response.helper';
import { UserQueryDto } from './dto/user-query.dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    await this.usersService.create(createUserDto);
    return ApiResponse.success('User berhasil dibuat');
  }

  @Get()
  async findAll(@Query() query: UserQueryDto) {
    const result = await this.usersService.findAll(query);
    return ApiResponse.successWithPaginate(
      'Data client berhasil diambil',
      result.data,
      result.meta,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.usersService.findOne(+id);
    return ApiResponse.successWithData('Data client berhasil diambil', result);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    this.usersService.update(+id, updateUserDto);
    return ApiResponse.success('Data berhasil diperbarui');
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    this.usersService.remove(+id);
    return ApiResponse.success('Data client berhasil dihapus');
  }
}
