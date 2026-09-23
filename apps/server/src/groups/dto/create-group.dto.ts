import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsInDatabase } from '@/validators/is-in-database.validator';
import { User } from '@/users/entities/user.entity';

export class CreateGroupDto {
  @ApiProperty({
    example: 'Engineering',
    minLength: 1,
    maxLength: 30,
    description: 'Group name.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    required: false,
    description:
      'List of user IDs to assign to the group. This overrides any existing group assignments. ' +
      'If provided but with an empty array, all assignments are removed.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @IsInDatabase(User, 'id', { each: true })
  users?: string[];
}
