import { ApiProperty } from '@nestjs/swagger';
import { type LocaleCode, SUPPORTED_LOCALES } from '../locales';

export class LocaleDto {
  @ApiProperty({ enum: SUPPORTED_LOCALES })
  code: LocaleCode;

  @ApiProperty({ example: 'Dutch', description: 'English name of the locale' })
  name: string;

  @ApiProperty({
    example: 'Nederlands',
    description: 'Localized name of the locale',
  })
  nameLocalized: string;
}
