import { ApiProperty } from '@nestjs/swagger';

export class UploadPhotoDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File gambar profil (JPG, PNG, JPEG)',
    required: true,
  })
  photo: Express.Multer.File; // Tipe ini sesuai dengan apa yang diterima dari Multer
}
