import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesModule } from '@/courses/courses.module';
import { ChaptersModule } from '@/chapters/chapters.module';
import { Chapter } from '@/chapters/entities/chapter.entity';
import { CompletedChaptersController } from './completed-chapters.controller';
import { CompletedChaptersService } from './completed-chapters.service';
import { CompletedChapter } from './entities/completed-chapter.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompletedChapter, Chapter]),
    CoursesModule,
    ChaptersModule,
  ],
  controllers: [CompletedChaptersController],
  providers: [CompletedChaptersService],
  exports: [CompletedChaptersService],
})
export class CompletedChaptersModule {}
