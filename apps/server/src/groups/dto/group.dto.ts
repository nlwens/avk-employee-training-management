import { ApiProperty } from '@nestjs/swagger';

export class GroupDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Engineering' })
  name: string;
}
