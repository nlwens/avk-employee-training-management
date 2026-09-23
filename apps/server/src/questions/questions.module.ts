import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesModule } from '@/courses/courses.module';
import { Answer } from '@/answers/entities/answer.entity';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { Question } from './entities/question.entity';
import { QuestionTranslation } from './entities/question-translation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, QuestionTranslation, Answer]),
    CoursesModule,
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
