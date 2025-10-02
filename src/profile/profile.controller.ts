import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HasRoles } from '@/auth/decorators/roles.decorator';
import { ProfileQueryDto } from './dto/profile-query.dto';
import { ApiResponse } from '@/common/helpers/api-response.helper';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateProfileDto } from './dto/update.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadPhotoDto } from './dto/upload-photo.dto';
import { ValidationPipe } from '@/common/pipes/validation.pipe';

const multerOptions = {
  storage: diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
};

@ApiTags('Profil')
@Controller('api/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @HasRoles('admin')
  @Get()
  async findAll(@Query() query: ProfileQueryDto) {
    const result = await this.profileService.findAll(query);

    return ApiResponse.successWithPaginate(
      'Data client berhasil diambil',
      result.data,
      result.meta,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.profileService.findOne(id);
    return ApiResponse.successWithData('Data client berhasil diambil', result);
  }

  @HasRoles('admin', 'client')
  @Patch(':id/update-status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProfile: UpdateStatusDto,
  ) {
    const result = await this.profileService.updateStatus(id, updateProfile);
    return ApiResponse.success('Status berhasil diperbarui');
  }

  @HasRoles('client')
  @Patch(':id/update-profile')
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProfile: UpdateProfileDto,
  ) {
    const result = await this.profileService.updateProfile(id, updateProfile);
    return ApiResponse.success('Data client berhasil diperbarui');
  }

  @HasRoles('client')
  @Patch(':id/update-photo')
  @UseInterceptors(FileInterceptor('photo', multerOptions))
  @ApiOperation({ summary: 'Upload atau perbarui foto profil' }) // Deskripsi endpoint
  @ApiConsumes('multipart/form-data') // Beritahu Swagger tipe kontennya
  @ApiBody({
    description: 'Upload file gambar untuk profil',
    type: UploadPhotoDto, // Gunakan DTO yang sudah kita buat
  })
  async updatePhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(ValidationPipe)
    photo: Express.Multer.File,
  ) {
    const result = await this.profileService.updatePhoto(id, photo);
    return ApiResponse.success('Foto berhasil diperbarui');
  }

  @HasRoles('admin')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.profileService.remove(id);
    return ApiResponse.success('Data client berhasil dihapus');
  }
}
