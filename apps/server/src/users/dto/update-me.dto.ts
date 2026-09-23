import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Locale } from '@/locales/entities/locale.entity';
import { IsInDatabase } from '@/validators/is-in-database.validator';
import { type LocaleCode, SUPPORTED_LOCALES } from '@/locales/locales';

export class UpdateMeDto {
  @ApiProperty({ enum: SUPPORTED_LOCALES, required: false })
  @IsOptional()
  @IsString()
  @IsInDatabase(Locale, 'code')
  locale?: LocaleCode;

  @ApiProperty({
    format: 'password',
    example: 'password123',
    required: false,
    description:
      'Current password for the user account. This is required to change the password.',
  })
  @ValidateIf((body: UpdateMeDto) => body.password !== undefined)
  @IsNotEmpty()
  @IsString()
  currentPassword?: string;

  @ApiProperty({
    format: 'password',
    example: 'SuperSecretPassword123@',
    minLength: 8,
    required: false,
    description:
      'New password for the user account. The current password is required to change it.',
  })
  @ValidateIf((body: UpdateMeDto) => body.currentPassword !== undefined)
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password?: string;
}
