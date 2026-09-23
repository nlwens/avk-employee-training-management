import { Injectable, Logger } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SeedFactory } from '@/seeder/seed.factory';
import { User } from '@/users/entities/user.entity';
import { Chapter } from '@/chapters/entities/chapter.entity';
import { CompletedChapter } from './entities/completed-chapter.entity';

@Injectable()
export class CompletedChaptersSeeder {
  private readonly logger = new Logger(CompletedChaptersSeeder.name);

  constructor(
    private readonly factory: SeedFactory,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async seed(chapter: Chapter, count?: number): Promise<CompletedChapter[]> {
    this.logger.log(`Seeding completed chapters for chapter ${chapter.id}...`);

    const users = await this.dataSource.getRepository(User).find();

    return Promise.all(
      faker.helpers.arrayElements(users, count).map((user) =>
        this.factory.create(CompletedChapter, {
          userId: user.id,
          chapterId: chapter.id,
        }),
      ),
    );
  }
}
