import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { type LocaleCode, SUPPORTED_LOCALES } from '../../locales/locales';

type Constructor<T> = new (...args: unknown[]) => T;

export abstract class BaseTranslationInputDto {
  @ApiProperty({ enum: SUPPORTED_LOCALES, example: SUPPORTED_LOCALES[0] })
  @IsIn(SUPPORTED_LOCALES)
  @IsNotEmpty()
  locale: LocaleCode;
}

export function CreateBaseTranslationDto<T extends BaseTranslationInputDto>(
  translationType: Constructor<T>,
) {
  abstract class CreateBaseTranslationDtoClass {
    @ApiProperty({ type: [translationType], minItems: 1 })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayUnique((entity: T) => entity.locale)
    @ValidateNested({ each: true })
    @Type(() => translationType)
    translations: T[];
  }

  return CreateBaseTranslationDtoClass;
}
