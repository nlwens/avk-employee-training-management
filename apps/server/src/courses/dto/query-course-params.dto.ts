import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { TransformToBoolean } from '@/common/decorators/transform-to-boolean.decorator';

export class PublicQueryCourseParamsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Search term for filtering courses by title or description/content across all locales.',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class QueryCourseParamsDto extends PublicQueryCourseParamsDto {
  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filter courses by published status (admin only).',
  })
  @TransformToBoolean()
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description:
      'Filter courses by the user’s progress. When `false`, returns courses the user has ' +
      'started (at least one completed chapter) but not finished (answered a different ' +
      'number of questions than the course has). When `true`, returns only courses the ' +
      'user has fully completed (every chapter completed and every question answered).',
  })
  @TransformToBoolean()
  @IsOptional()
  @IsBoolean()
  finished?: boolean;
}
