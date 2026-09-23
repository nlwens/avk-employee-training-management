import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';
import {
  BaseTranslationInputDto,
  CreateBaseTranslationDto,
} from '@/common/dto/create-base-translation.dto';

export class CreateChapterTranslationDto extends BaseTranslationInputDto {
  @ApiProperty({
    example: 'Operations Chapter',
    minLength: 3,
    maxLength: 100,
    description: 'Localized chapter title.',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  title: string;
}

export class CreateChapterDto extends CreateBaseTranslationDto(
  CreateChapterTranslationDto,
) {
  @ApiProperty({ type: Number, format: 'int32', required: true })
  @IsNumber()
  @IsNotEmpty()
  order: number;
}
