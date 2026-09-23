import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { type LocaleCode, SUPPORTED_LOCALES } from '@/locales/locales';

class CourseTranslationDto {
  @Exclude()
  courseId: string;

  @ApiProperty({ enum: SUPPORTED_LOCALES })
  localeCode: LocaleCode;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true, type: String })
  content: string | null;
}

export class CourseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  published: boolean;

  @ApiProperty()
  priority: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @Type(() => CourseTranslationDto)
  @ApiProperty({ type: [CourseTranslationDto] })
  translations: CourseTranslationDto[];

  @ApiProperty({ description: 'Total number of chapters in this course.' })
  chaptersCount: number;

  @ApiProperty({ description: 'Total number of questions in this course.' })
  questionsCount: number;

  @ApiProperty({
    description:
      'Number of chapters that the current user has completed in this course. ' +
      'This field is not populated for administrator actions (like update).',
  })
  completedChaptersCount: number;

  @ApiProperty({
    description:
      'Number of questions the user answered correctly in this course. ' +
      'This field is not populated for administrator actions (like update).',
  })
  correctAnswersCount: number;
}
