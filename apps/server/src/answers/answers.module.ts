import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesModule } from '@/courses/courses.module';
import { QuestionsModule } from '@/questions/questions.module';
import { AnswersController } from './answers.controller';
import { UserAnswersController } from './user-answers.controller';
import { AnswersService } from './answers.service';
import { Answer } from './entities/answer.entity';
import { AnswerTranslation } from './entities/answer-translation.entity';
import { UserAnswer } from './entities/user-answer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Answer, AnswerTranslation, UserAnswer]),
    CoursesModule,
    QuestionsModule,
  ],
  controllers: [AnswersController, UserAnswersController],
  providers: [AnswersService],
  exports: [AnswersService],
})
export class AnswersModule {}
