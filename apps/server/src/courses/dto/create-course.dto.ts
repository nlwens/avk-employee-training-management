import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { Group } from '@/groups/entities/group.entity';
import { IsInDatabase } from '@/validators/is-in-database.validator';
import {
  BaseTranslationInputDto,
  CreateBaseTranslationDto,
} from '@/common/dto/create-base-translation.dto';

export class CreateCourseTranslationDto extends BaseTranslationInputDto {
  @ApiProperty({
    example: 'Introduction to Operations',
    minLength: 3,
    maxLength: 100,
    description: 'Localized course title.',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  title: string;

  @ApiProperty({
    example: 'This course covers the fundamentals.',
    required: false,
    description: 'Localized course description.',
  })
  @IsString()
  @IsOptional()
  content: string;
}

export class CreateCourseDto extends CreateBaseTranslationDto(
  CreateCourseTranslationDto,
) {
  @ApiProperty({ type: [String], format: 'uuid', required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @IsInDatabase(Group, 'id', { each: true })
  groups?: string[];

  @ApiProperty({
    required: false,
    default: 0,
    description:
      'Display priority used for ordering; higher values are listed first.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
