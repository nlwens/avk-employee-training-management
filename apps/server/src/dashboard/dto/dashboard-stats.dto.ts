import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({
    example: 25,
    description: 'Total number of non-admin users.',
  })
  totalEmployees: number;

  @ApiProperty({
    example: 10,
    description: 'Total number of published courses.',
  })
  publishedCourses: number;

  @ApiProperty({
    example: 10,
    description: 'Total number of groups.',
  })
  groups: number;
}
