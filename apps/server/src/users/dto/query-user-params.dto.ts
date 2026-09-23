import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryUserParamsDto {
  @ApiProperty({
    required: false,
    description: 'Search term for filtering users',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
