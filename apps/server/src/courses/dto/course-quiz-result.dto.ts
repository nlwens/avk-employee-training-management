import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CourseQuizResultDto {
  @ApiProperty({ description: 'The ID of the user who completed the quiz.' })
  userId: string;

  @ApiProperty({ description: 'Number of correctly answered questions.' })
  @Type(() => Number)
  score: number;

  @ApiProperty({ description: 'When the user completed the quiz.' })
  submittedAt: Date;
}
