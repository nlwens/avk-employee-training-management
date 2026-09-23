import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['locale'] as const),
) {
  @ApiProperty({
    required: false,
    example: 'password123',
    minLength: 8,
    format: 'password',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
