import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import {
  BaseTranslationInputDto,
  CreateBaseTranslationDto,
} from '@/common/dto/create-base-translation.dto';

class CreateAnswerTranslationDto extends BaseTranslationInputDto {
  @ApiProperty({
    example: 'No',
    minLength: 2,
    maxLength: 100,
    description: 'Localized answer option text for a quiz question.',
  })
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  text: string;
}

export class CreateAnswerDto extends CreateBaseTranslationDto(
  CreateAnswerTranslationDto,
) {}
