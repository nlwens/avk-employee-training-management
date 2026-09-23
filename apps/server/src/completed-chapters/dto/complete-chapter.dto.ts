import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { IsInDatabase } from '@/validators/is-in-database.validator';
import { Chapter } from '@/chapters/entities/chapter.entity';

export class CompleteChapterDto {
  @IsUUID()
  @IsInDatabase(Chapter, 'id')
  @ApiProperty({ format: 'uuid' })
  chapterId: string;
}
