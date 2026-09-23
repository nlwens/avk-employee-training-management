import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class UserActivationDto {
  @Exclude()
  userId: string;

  @Exclude()
  code: string;

  @ApiProperty()
  expiresAt: Date;
}
