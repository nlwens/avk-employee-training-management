import { ApiProperty } from '@nestjs/swagger';

export class CompletedChapterDto {
  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ format: 'uuid' })
  chapterId: string;

  @ApiProperty()
  createdAt: Date;
}
