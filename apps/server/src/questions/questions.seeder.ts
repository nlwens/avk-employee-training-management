import { Injectable, Logger } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { SUPPORTED_LOCALES } from '@/locales/locales';
import { SeedFactory } from '@/seeder/seed.factory';
import { Course } from '@/courses/entities/course.entity';
import { Answer } from '@/answers/entities/answer.entity';
import { AnswerTranslation } from '@/answers/entities/answer-translation.entity';
import { QuestionTranslation } from './entities/question-translation.entity';
import { Question } from './entities/question.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class QuestionsSeeder {
  private readonly logger = new Logger(QuestionsSeeder.name);

  constructor(
    private readonly factory: SeedFactory,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async seed(course: Course, count = 3): Promise<Question[]> {
    this.logger.log(`Seeding ${count} questions for course ${course.id}...`);

    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
      const question = await this.factory.create(Question, {
        courseId: course.id,
        order: i + 1,
      });

      question.answers = await Promise.all(
        Array.from({ length: faker.number.int({ min: 3, max: 4 }) }, () =>
          this.factory.create(Answer, { questionId: question.id }),
        ),
      );

      for (const answer of question.answers) {
        answer.translations = await Promise.all(
          SUPPORTED_LOCALES.map((localeCode) =>
            this.factory.create(AnswerTranslation, {
              answerId: answer.id,
              localeCode,
            }),
          ),
        );
      }

      question.translations = await Promise.all(
        SUPPORTED_LOCALES.map((localeCode) =>
          this.factory.create(QuestionTranslation, {
            questionId: question.id,
            localeCode,
          }),
        ),
      );

      question.correctAnswerId = faker.helpers.arrayElement(
        question.answers,
      ).id;

      await this.dataSource.manager.save(question);

      questions.push(question);
    }

    return questions;
  }
}
