import { Injectable, Logger } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { GroupsService } from '@/groups/groups.service';
import { SUPPORTED_LOCALES } from '@/locales/locales';
import { SeedFactory } from '@/seeder/seed.factory';
import { Group } from '@/groups/entities/group.entity';
import { ChaptersSeeder } from '@/chapters/chapters.seeder';
import { QuestionsSeeder } from '@/questions/questions.seeder';
import { Course } from './entities/course.entity';
import { CourseTranslation } from './entities/course-translation.entity';

@Injectable()
export class CoursesSeeder {
  private readonly logger = new Logger(CoursesSeeder.name);

  constructor(
    private readonly factory: SeedFactory,
    private readonly groupsService: GroupsService,
    private readonly chaptersSeeder: ChaptersSeeder,
    private readonly questionsSeeder: QuestionsSeeder,
  ) {}

  async seed(count = 10, overrideGroups?: Group[]): Promise<Course[]> {
    this.logger.log(`Seeding ${count} courses...`);

    const courses: Course[] = [];
    const groups = await this.groupsService.getAllGroups();

    for (let i = 0; i < count; i++) {
      const course = await this.factory.create(Course, {
        groups:
          overrideGroups ??
          faker.helpers.arrayElements(groups, { min: 0, max: 3 }),
      });

      courses.push(course);

      course.translations = await Promise.all(
        SUPPORTED_LOCALES.map((localeCode) =>
          this.factory.create(CourseTranslation, {
            courseId: course.id,
            localeCode,
          }),
        ),
      );

      course.chapters = await this.chaptersSeeder.seed(course, 3);
      course.questions = await this.questionsSeeder.seed(course, 3);
    }

    return courses;
  }
}
