import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { type LocaleCode, SUPPORTED_LOCALES } from '@/locales/locales';
import { SegmentFileDto } from '@/files/dtos/segment-file.dto';
import { SegmentAttachmentType } from '../segments';

class SegmentTranslationDto {
  @Exclude()
  segmentId: string;

  @ApiProperty({ enum: SUPPORTED_LOCALES })
  localeCode: LocaleCode;

  @ApiProperty({ nullable: true, type: String, example: 'Segment content' })
  content: string;
}

export class SegmentDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    format: 'uuid',
    description: 'ID of the segment chapter',
  })
  chapterId: string;

  @ApiProperty({ format: 'enum', example: 'pdf' })
  type: SegmentAttachmentType;

  @ApiProperty()
  order: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @Type(() => SegmentTranslationDto)
  @ApiProperty({ type: [SegmentTranslationDto] })
  translations: SegmentTranslationDto[];

  @Type(() => SegmentFileDto)
  @ApiProperty({
    type: [SegmentFileDto],
    description: 'Files attached to this segment',
  })
  files: SegmentFileDto[];
}
