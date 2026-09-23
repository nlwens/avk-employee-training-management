import { ApiProperty } from '@nestjs/swagger';
import { MimeType } from '../files';

export class FileDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 1024, description: 'File size in bytes.' })
  size: number;

  @ApiProperty({ example: '2ca45e44-7afd-4ea3-8ed2-b0b2e45ce19c.pdf' })
  name: string;

  @ApiProperty({ enum: MimeType, example: MimeType.PDF })
  mimetype: MimeType;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
