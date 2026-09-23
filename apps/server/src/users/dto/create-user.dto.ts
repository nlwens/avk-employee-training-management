import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Group } from '@/groups/entities/group.entity';
import { Locale } from '@/locales/entities/locale.entity';
import { IsInDatabase } from '@/validators/is-in-database.validator';
import {
  DEFAULT_LOCALE,
  type LocaleCode,
  SUPPORTED_LOCALES,
} from '@/locales/locales';

export class CreateUserDto {
  @ApiProperty({ example: 'John', minLength: 2, maxLength: 50 })
  @IsNotEmpty()
  @Length(2, 50)
  name: string;

  @ApiProperty({ example: 'Doe', minLength: 2, maxLength: 50 })
  @IsNotEmpty()
  @Length(2, 50)
  surname: string;

  @ApiProperty({ example: 'user@example.com', format: 'email' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  admin?: boolean;

  @ApiProperty({
    enum: SUPPORTED_LOCALES,
    default: DEFAULT_LOCALE,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsInDatabase(Locale, 'code')
  locale?: LocaleCode;

  @ApiProperty({ type: [String], format: 'uuid', required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @IsInDatabase(Group, 'id', { each: true })
  groups?: string[];
}
