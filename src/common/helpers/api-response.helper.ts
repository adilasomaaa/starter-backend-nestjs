import { HttpStatus } from '@nestjs/common';

// Ini adalah struktur dasar untuk semua respons
export interface IApiResponse<T> {
    statusCode: number;
    success: boolean;
    message: string;
    data?: T;
    meta?: {
        page: number;
        limit: number;
        totalData: number;
        totalPages: number;
    };
}

export class ApiResponse {
    /**
     * Membuat respons sukses tanpa data.
     * @param message Pesan sukses.
     * @returns Objek respons standar.
     */
    static success(message: string): IApiResponse<null> {
        return {
            statusCode: HttpStatus.OK,
            success: true,
            message,
            data: null,
        };
    }

    /**
     * Membuat respons sukses dengan data.
     * @param message Pesan sukses.
     * @param data Data yang akan dikirim.
     * @returns Objek respons standar dengan data.
     */
    static successWithData<T>(message: string, data: T): IApiResponse<T> {
        return {
            statusCode: HttpStatus.OK,
            success: true,
            message,
            data,
        };
    }

    /**
     * Membuat respons sukses dengan data yang dipaginasi.
     * @param message Pesan sukses.
     * @param data Array data untuk halaman saat ini.
     * @param meta Objek metadata paginasi.
     * @returns Objek respons standar dengan data dan metadata paginasi.
     */
    static successWithPaginate<T>(
        message: string,
        data: T,
        meta: { page: number; limit: number; totalData: number; totalPages: number },
    ): IApiResponse<T> {
        return {
            statusCode: HttpStatus.OK,
            success: true,
            message,
            data,
            meta,
        };
    }

    /**
     * Membuat respons error tanpa data.
     * @param statusCode Kode status HTTP.
     * @param message Pesan error.
     * @returns Objek respons error standar.
     */
    static error(statusCode: number, message: string): IApiResponse<null> {
        return {
        statusCode,
        success: false,
        message,
        data: null,
        };
    }

    /**
     * MEMBUAT RESPONS ERROR DENGAN DATA (BARU)
     * Berguna untuk mengirim detail error, misalnya error validasi.
     * @param statusCode Kode status HTTP.
     * @param message Pesan error utama.
     * @param data Objek atau data yang menjelaskan error.
     * @returns Objek respons error dengan data.
     */
    static errorWithData<T>(
        statusCode: number,
        message: string,
        data: T,
    ): IApiResponse<T> {
        return {
        statusCode,
        success: false,
        message,
        data,
        };
    }
}