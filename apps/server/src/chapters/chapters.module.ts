import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesModule } from '../courses/courses.module';
import { ChaptersController } from './chapters.controller';
import { ChaptersService } from './chapters.service';
import { ChapterTranslation } from './entities/chapter-translation.entity';
import { Chapter } from './entities/chapter.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chapter, ChapterTranslation]),
    CoursesModule,
  ],
  controllers: [ChaptersController],
  providers: [ChaptersService],
  exports: [ChaptersService],
})
export class ChaptersModule {}
