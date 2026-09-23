import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

type Constructor<T> = new (...args: unknown[]) => T;

export function PaginatedResponseDto<T>(itemType: Constructor<T>) {
  abstract class PaginatedResponseDtoClass {
    @ApiProperty({ type: [itemType] })
    @Type(() => itemType)
    data: T[];

    @ApiProperty({ description: 'Total number of items across all pages.' })
    total: number;

    @ApiProperty({ description: 'Maximum number of items per page.' })
    limit: number;

    @ApiProperty({ description: 'Current page number.' })
    page: number;

    @ApiProperty({ description: 'Total number of pages.' })
    pages: number;
  }

  return PaginatedResponseDtoClass;
}
