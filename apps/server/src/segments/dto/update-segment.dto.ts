import { CreateSegmentTranslationDto } from './create-segment.dto';
import {
  ArrayUnique,
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSegmentDto {
  @ApiProperty({
    type: Number,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  order?: number;

  @ApiProperty({
    type: [CreateSegmentTranslationDto],
    required: false,
    description:
      'Required for text-based segments, optional for file-based segments',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @IsArray()
  @ArrayUnique((t: CreateSegmentTranslationDto) => t.locale)
  @Type(() => CreateSegmentTranslationDto)
  translations?: CreateSegmentTranslationDto[];
}
