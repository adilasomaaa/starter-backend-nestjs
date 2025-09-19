// file: src/common/pipes/photo-validation.pipe.ts

import {
  Injectable,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  FileValidator,
  PipeTransform,
  BadRequestException,
  FileTypeValidatorOptions, // <-- Impor BadRequestException
} from '@nestjs/common';

// Tambahkan properti untuk pesan error kustom
export interface PhotoValidationOptions {
  fileIsRequired?: boolean;
  maxSize?: number; // dalam byte
  fileType?: RegExp;
  message?: string; // Pesan umum jika file tidak ada
}

interface CustomFileTypeValidatorOptions extends FileTypeValidatorOptions {
  message?: string;
}

@Injectable()
export class ValidationPipe
  extends ParseFilePipe
  implements PipeTransform
{
  constructor(protected readonly options: PhotoValidationOptions = {}) {
    const { fileIsRequired = true, maxSize, fileType, message } = options;
    const validators: FileValidator[] = [];

    // Tambahkan validator dengan pesan kustom jika opsi disediakan
    if (maxSize) {
      validators.push(
        new MaxFileSizeValidator({
          maxSize,
          message: `Ukuran file terlalu besar. Maksimal ${maxSize / 1024 / 1024}MB.`, // Pesan default yang lebih baik
        }),
      );
    }

    if (fileType) {
      validators.push(
        new FileTypeValidator({
          fileType,
          message: `Tipe file tidak valid. Tipe yang diizinkan: ${fileType}.`,
        } as CustomFileTypeValidatorOptions),
      );
    }

    // Panggil constructor dari parent (ParseFilePipe)
    super({
      validators,
      fileIsRequired,
      // Gunakan exceptionFactory untuk pesan "file wajib diisi" yang kustom
      exceptionFactory: (error) => {
        // Jika tidak ada file (dan fileIsRequired true), error akan kosong
        // Jika validasi gagal, error akan berisi pesan dari validator
        const errorMessage = message || error || 'File tidak valid.';
        throw new BadRequestException(errorMessage);
      },
    });
  }
}
