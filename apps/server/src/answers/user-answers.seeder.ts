import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { SeedFactory } from '@/seeder/seed.factory';
import { UserAnswer } from './entities/user-answer.entity';
import { User } from '@/users/entities/user.entity';
import { Question } from '@/questions/entities/question.entity';

@Injectable()
export class UserAnswersSeeder {
  private readonly logger = new Logger(UserAnswersSeeder.name);

  constructor(
    private readonly factory: SeedFactory,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async seed(
    question: Question,
    count?: number,
    onlyCorrect = false,
  ): Promise<UserAnswer[]> {
    this.logger.log(`Seeding user answers for question ${question.id}...`);

    const users = await this.dataSource.getRepository(User).find();

    return Promise.all(
      faker.helpers.arrayElements(users, count).map((user) =>
        this.factory.create(UserAnswer, {
          userId: user.id,
          questionId: question.id,
          answerId:
            onlyCorrect && question.correctAnswerId
              ? question.correctAnswerId
              : faker.helpers.arrayElement(question.answers).id,
        }),
      ),
    );
  }
}
