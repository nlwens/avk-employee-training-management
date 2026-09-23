import { ApiProperty } from '@nestjs/swagger';
import { type LocaleCode } from '@/locales/locales';

export class AnswerSubmissionDto {
  @ApiProperty({
    format: 'uuid',
    nullable: true,
    description: 'ID of the correct answer',
  })
  correctAnswerId: string | null;

  @ApiProperty({
    description: 'Explanation of the correct answer, keyed by locale code',
    example: { en: 'Because...', nl: 'Omdat...' },
  })
  explanation: Record<LocaleCode, string | null>;
}
