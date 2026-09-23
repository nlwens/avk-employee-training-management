import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesModule } from '@/courses/courses.module';
import { ChaptersModule } from '@/chapters/chapters.module';
import { FilesModule } from '@/files/files.module';
import { Segment } from './entities/segment.entity';
import { SegmentTranslation } from './entities/segment-translation.entity';
import { SegmentsController } from './segments.controller';
import { SegmentService } from './segments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Segment, SegmentTranslation]),
    CoursesModule,
    ChaptersModule,
    FilesModule,
  ],
  controllers: [SegmentsController],
  providers: [SegmentService],
})
export class SegmentsModule {}
