import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeederModule } from './seeder.module';
import { SeedFactory } from './seed.factory';
import { CoursesSeeder } from '@/courses/courses.seeder';
import { Group } from '@/groups/entities/group.entity';
import { UsersSeeder } from '@/users/users.seeder';
import { UserAnswersSeeder } from '@/answers/user-answers.seeder';
import { CompletedChaptersSeeder } from '@/completed-chapters/completed-chapters.seeder';

async function bootstrap() {
  const logger = new Logger('Seed');

  logger.log('🌱  Starting seeder');

  const app = await NestFactory.createApplicationContext(SeederModule, {
    logger: ['error', 'warn', 'log'],
  });

  const factory = app.get(SeedFactory);

  await factory.createMany(Group, 3);
  await app.get(UsersSeeder).seed(5);

  const courses = await app.get(CoursesSeeder).seed(10);

  for (const course of courses) {
    // Seed user answers for each course question.
    for (const question of course.questions) {
      await app.get(UserAnswersSeeder).seed(question);
    }

    // Seed completion progress for each chapter.
    for (const chapter of course.chapters) {
      await app.get(CompletedChaptersSeeder).seed(chapter);
    }
  }

  logger.log('🌱  Done');

  await app.close();
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
