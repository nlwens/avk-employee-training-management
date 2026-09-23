import { BaseTranslationInputDto } from '@/common/dto/create-base-translation.dto';
import { SegmentAttachmentType } from '../segments';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmpty,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSegmentTranslationDto extends BaseTranslationInputDto {
  @ApiProperty({ example: 'This is a text content' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CreateSegmentDto {
  @ApiProperty({
    enum: Object.values(SegmentAttachmentType),
    required: true,
    example: SegmentAttachmentType.TEXT,
  })
  @IsNotEmpty()
  @IsEnum(SegmentAttachmentType)
  type: SegmentAttachmentType;

  @ApiProperty({
    type: Number,
    example: 10,
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  order: number;

  /**
   * translations are added here manually, since
   * they are optional, and can be ignored if
   * segment includes file attachments.
   */
  @ApiProperty({
    type: [CreateSegmentTranslationDto],
    required: false,
    description:
      'Required for text-based segments, optional for file-based segments',
  })
  @ValidateIf((o) => o.type === SegmentAttachmentType.TEXT)
  @ValidateNested({ each: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((t: CreateSegmentTranslationDto) => t.locale)
  @Type(() => CreateSegmentTranslationDto)
  translations?: CreateSegmentTranslationDto[];

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'English file attachment',
    required: false,
  })
  @IsEmpty()
  file_en?: never;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Dutch file attachment',
    required: false,
  })
  @IsEmpty()
  file_nl?: never;
}
