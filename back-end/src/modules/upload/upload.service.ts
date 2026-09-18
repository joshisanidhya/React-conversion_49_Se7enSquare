import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { randomBytes } from 'node:crypto';

@Injectable()
export class UploadService {
  private uploadDir = join(process.cwd(), 'uploads');

  constructor() {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getUploadDir(): string {
    return this.uploadDir;
  }

  processUploadedFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return {
      success: true,
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      fileUrl: `/uploads/${file.filename}`,
    };
  }

  static fileFilter(req: any, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          `Invalid file type '${file.mimetype}'. Allowed types: JPG, PNG, GIF, WEBP, PDF, TXT.`,
        ),
        false,
      );
    }
    callback(null, true);
  }

  static generateFilename(req: any, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) {
    const safeExt = extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    const randomHex = randomBytes(8).toString('hex');
    const safeName = `${Date.now()}-${randomHex}${safeExt || '.bin'}`;
    callback(null, safeName);
  }
}
