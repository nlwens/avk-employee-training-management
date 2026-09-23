import {
  BaseTranslationInputDto,
  CreateBaseTranslationDto,
} from '@/common/dto/create-base-translation.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class CreateQuestionTranslationDto extends BaseTranslationInputDto {
  @ApiProperty({
    minLength: 3,
    maxLength: 500,
    description: 'Localized question prompt shown to the user.',
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 500)
  text: string;

  @ApiProperty({
    type: String,
    nullable: true,
    required: false,
    minLength: 5,
    example:
      'Always check the scene first so you do not put yourself in danger.',
    description:
      'Optional localized explanation shown after answering. Must be at least 5 characters.',
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  explanation: string | null;
}

export class CreateQuestionDto extends CreateBaseTranslationDto(
  CreateQuestionTranslationDto,
) {
  @ApiProperty({ type: Number, default: 0, required: false })
  @IsOptional()
  @IsInt()
  order?: number;
}
