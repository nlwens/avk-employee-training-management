import { ApiProperty } from '@nestjs/swagger';

export class CourseStatsDto {
  @ApiProperty({
    description:
      'Average score percentage across users who answered all questions in this course.',
    example: 40,
  })
  averageScore: number;
}
