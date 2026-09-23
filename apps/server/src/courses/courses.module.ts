import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsModule } from '@/groups/groups.module';
import { UsersModule } from '@/users/users.module';
import { CompletedChapter } from '@/completed-chapters/entities/completed-chapter.entity';
import { Question } from '@/questions/entities/question.entity';
import { UserAnswer } from '@/answers/entities/user-answer.entity';
import { CoursesController } from './courses.controller';
import { UserCoursesController } from './user-courses.controller';
import { CoursesService } from './courses.service';
import { CoursesCsvService } from './courses-csv.service';
import { CoursesRepository } from './courses.repository';
import { CourseTranslation } from './entities/course-translation.entity';
import { Course } from './entities/course.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      CourseTranslation,
      CompletedChapter,
      Question,
      UserAnswer,
    ]),
    GroupsModule,
    UsersModule,
  ],
  controllers: [CoursesController, UserCoursesController],
  providers: [CoursesService, CoursesCsvService, CoursesRepository],
  exports: [CoursesService],
})
export class CoursesModule {}
