import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { type LocaleCode, SUPPORTED_LOCALES } from '@/locales/locales';

class AnswerTranslationDto {
  @Exclude()
  answerId: string;

  @ApiProperty({ enum: SUPPORTED_LOCALES })
  localeCode: LocaleCode;

  @ApiProperty()
  text: string;
}

export class AnswerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    format: 'uuid',
    description: 'ID of the question this answer belongs to',
  })
  questionId: string;

  @Type(() => AnswerTranslationDto)
  @ApiProperty({ type: [AnswerTranslationDto] })
  translations: AnswerTranslationDto[];
}
