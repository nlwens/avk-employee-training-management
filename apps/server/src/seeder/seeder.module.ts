import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@/databases/database.module';
import { LocalesModule } from '@/locales/locales.module';
import { I18nModule } from '@/i18n/i18n.module';
import { UsersModule } from '@/users/users.module';
import { GroupsModule } from '@/groups/groups.module';
import { CoursesModule } from '@/courses/courses.module';
import { ChaptersModule } from '@/chapters/chapters.module';
import { AnswersModule } from '@/answers/answers.module';
import { QuestionsModule } from '@/questions/questions.module';
import { CompletedChaptersModule } from '@/completed-chapters/completed-chapters.module';
import { UsersSeeder } from '@/users/users.seeder';
import { CoursesSeeder } from '@/courses/courses.seeder';
import { ChaptersSeeder } from '@/chapters/chapters.seeder';
import { QuestionsSeeder } from '@/questions/questions.seeder';
import { SegmentsModule } from '@/segments/segments.module';
import { SegmentsSeeder } from '@/segments/segments.seeder';
import { UserAnswersSeeder } from '@/answers/user-answers.seeder';
import { CompletedChaptersSeeder } from '@/completed-chapters/completed-chapters.seeder';
import { SeedFactory } from './seed.factory';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    I18nModule,
    DatabaseModule,
    LocalesModule,
    UsersModule,
    GroupsModule,
    CoursesModule,
    ChaptersModule,
    SegmentsModule,
    AnswersModule,
    QuestionsModule,
    CompletedChaptersModule,
  ],
  providers: [
    SeedFactory,
    UsersSeeder,
    CoursesSeeder,
    ChaptersSeeder,
    SegmentsSeeder,
    QuestionsSeeder,
    UserAnswersSeeder,
    CompletedChaptersSeeder,
  ],
})
export class SeederModule {}
