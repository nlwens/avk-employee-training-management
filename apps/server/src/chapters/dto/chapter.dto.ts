import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { type LocaleCode, SUPPORTED_LOCALES } from '@/locales/locales';

class ChapterTranslationDto {
  @Exclude()
  chapterId: string;

  @ApiProperty({ enum: SUPPORTED_LOCALES })
  localeCode: LocaleCode;

  @ApiProperty({ type: String })
  title: string;
}

export class ChapterDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    format: 'uuid',
    description: 'ID of the course this chapter belongs to',
  })
  courseId: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @Type(() => ChapterTranslationDto)
  @ApiProperty({ type: [ChapterTranslationDto] })
  translations: ChapterTranslationDto[];
}
