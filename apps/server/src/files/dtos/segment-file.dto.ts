import { FileDto } from '@/files/dtos/file.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { type LocaleCode, SUPPORTED_LOCALES } from '@/locales/locales';

export class SegmentFileDto extends FileDto {
  @ApiProperty({ enum: SUPPORTED_LOCALES, nullable: false })
  localeCode: LocaleCode | null;

  @Exclude()
  segmentId: string | null;
}
