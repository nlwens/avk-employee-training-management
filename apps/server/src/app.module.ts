import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { CoursesModule } from './courses/courses.module';
import { GroupsModule } from './groups/groups.module';
import { LocalesModule } from './locales/locales.module';
import { DatabaseModule } from './databases/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ValidatorsModule } from './validators/validators.module';
import { ChaptersModule } from './chapters/chapters.module';
import { SegmentsModule } from './segments/segments.module';
import { QuestionsModule } from './questions/questions.module';
import { AnswersModule } from './answers/answers.module';
import { CompletedChaptersModule } from './completed-chapters/completed-chapters.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { FilesModule } from './files/files.module';
import { MailerModule } from './mailer/mailer.module';
import { I18nModule } from './i18n/i18n.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UserActivationsModule } from './user-activations/user-activations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    I18nModule,
    ValidatorsModule,
    DatabaseModule,
    AuditLogModule,
    LocalesModule,
    AuthModule,
    GroupsModule,
    UsersModule,
    UserActivationsModule,
    CoursesModule,
    ChaptersModule,
    CompletedChaptersModule,
    SegmentsModule,
    QuestionsModule,
    AnswersModule,
    FilesModule,
    MailerModule,
    DashboardModule,
  ],
})
export class AppModule {}
