import {
  Injectable,
  PipeTransform,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { SegmentAttachmentType } from '../segments';
import { ErrorCode } from '@/common/enums/error-codes.enum';
import { FileMetadata } from '@/files/files';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly sizeValidations: Record<SegmentAttachmentType, number> = {
    [SegmentAttachmentType.PDF]: 50 * 1024 * 1024, // 50 MB
    [SegmentAttachmentType.VIDEO]: 200 * 1024 * 1024, // 200 MB
    [SegmentAttachmentType.IMAGE]: 50 * 1024 * 1024, // 50 MB
    [SegmentAttachmentType.PPTX]: 100 * 1024 * 1024, // 100 MB
    [SegmentAttachmentType.TEXT]: 0,
  };

  private readonly allowedExtensions: Record<SegmentAttachmentType, RegExp> = {
    [SegmentAttachmentType.PDF]: /\.(pdf)$/i,
    [SegmentAttachmentType.VIDEO]: /\.(mp4|webm|ogg)$/i,
    [SegmentAttachmentType.IMAGE]: /\.(jpg|jpeg|png|gif|webp)$/i,
    [SegmentAttachmentType.PPTX]:
      /\.(pptx|ppt|pptm|ppsx|pps|ppsm|potx|pot|potm|odp)$/i,
    [SegmentAttachmentType.TEXT]: /$/,
  };

  constructor(@Inject(REQUEST) private readonly req: Request) {}

  transform(files: { [key: string]: FileMetadata[] }) {
    if (!files) return {};

    const type = this.req.body.type as SegmentAttachmentType;

    if (type !== SegmentAttachmentType.TEXT && this.req.body.translations) {
      throw new BadRequestException({
        message: 'Translations are not allowed for file segments',
        code: ErrorCode.TRANSLATIONS_NOT_ALLOWED,
      });
    }

    for (const fieldFiles of Object.values(files)) {
      const [file] = fieldFiles;

      if (type === SegmentAttachmentType.TEXT) {
        throw new BadRequestException({
          message: 'Text segments must not include files',
          code: ErrorCode.INVALID_FILE_TYPE,
        });
      }

      const allowedExtensions = this.allowedExtensions[type];
      if (!file.originalname || !allowedExtensions.test(file.originalname)) {
        throw new BadRequestException({
          message: 'Invalid file type',
          code: ErrorCode.INVALID_FILE_TYPE,
        });
      }

      const maxSize = this.sizeValidations[type];
      if (file.size > maxSize) {
        throw new BadRequestException({
          message: 'Exceeds maximum of file size',
          code: ErrorCode.EXCEEDS_MAX_FILE_SIZE,
        });
      }
    }

    return files;
  }
}
