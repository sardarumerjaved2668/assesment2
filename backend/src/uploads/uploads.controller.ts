import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// multer ships with @nestjs/platform-express. require() avoids needing @types/multer.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');

// Absolute path to the folder where uploaded images are stored.
export const UPLOADS_DIR = join(process.cwd(), 'uploads');

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  @Post('image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a product image (admin only)' })
  @ApiResponse({ status: 201, description: 'Image stored; returns its public URL' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multer.diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req: any, file: any, cb: any) => {
          const unique = `${Date.now()}-${randomBytes(6).toString('hex')}`;
          cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req: any, file: any, cb: any) => {
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: any, @Req() req: any) {
    if (!file) {
      throw new BadRequestException(
        'No image file provided (form field name must be "image")',
      );
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return {
      url: `${baseUrl}/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
