import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { ExposeToAdmin } from '@/common/decorators/expose-to-admin.decorator';
import { AnswerDto } from '@/answers/dto/answer.dto';
import { type LocaleCode, SUPPORTED_LOCALES } from '@/locales/locales';

class QuestionTranslationDto {
  @Exclude()
  questionId: string;

  @ApiProperty({ enum: SUPPORTED_LOCALES })
  localeCode: LocaleCode;

  @ApiProperty()
  text: string;

  @ExposeToAdmin()
  @ApiProperty({
    nullable: true,
    description:
      'Explanation of the correct answer to the question. Available only to administrators.',
  })
  explanation: string | null;
}

export class QuestionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ default: 0 })
  order: number;

  @ApiProperty({
    format: 'uuid',
    description: 'ID of the course this question belongs to',
  })
  courseId: string;

  @ExposeToAdmin()
  @ApiProperty({
    format: 'uuid',
    nullable: true,
    type: String,
    description:
      'ID of the correct answer. This is exposed only to administrators.',
  })
  correctAnswerId: string | null;

  @Type(() => QuestionTranslationDto)
  @ApiProperty({ type: [QuestionTranslationDto] })
  translations: QuestionTranslationDto[];

  @Type(() => AnswerDto)
  @ApiProperty({ type: [AnswerDto] })
  answers: AnswerDto[];
}
