import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({ format: 'jwt' })
  accessToken: string;
}
