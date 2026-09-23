import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { hash } from 'bcrypt';
import { DUTCH_LOCALE, ENGLISH_LOCALE } from '@/locales/locales';
import { AuthModule } from '@/auth/auth.module';
import { CoursesModule } from '@/courses/courses.module';
import { UsersModule } from '@/users/users.module';
import { CourseDto } from '@/courses/dto/course.dto';
import { Course } from '@/courses/entities/course.entity';
import { CourseTranslation } from '@/courses/entities/course-translation.entity';
import { UserAnswer } from '@/answers/entities/user-answer.entity';
import { Group } from '@/groups/entities/group.entity';
import { User } from '@/users/entities/user.entity';
import { Question } from '@/questions/entities/question.entity';
import { SeedFactory } from '@/seeder/seed.factory';
import { QuestionsSeeder } from '@/questions/questions.seeder';
import {
  createTestServer,
  obtainAdminAuthToken,
  obtainAuthToken,
} from './utils';

const TEST_USER_PASSWORD = 'password';

function parseCsv(text: string): string[][] {
  return text
    .trim()
    .split('\n')
    .map((line) => line.split(','));
}

function formatExpectedFilenameDate(locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/\//g, '-');
}

describe('UserCoursesController (e2e)', () => {
  let app: INestApplication<App>;

  let adminToken: string;
  let userToken: string;
  let scoredUserToken: string;

  let userGroup: Group;
  let otherGroup: Group;

  let user: User;
  let scoredUser: User;

  let course: Course;
  let questions: Question[];

  beforeAll(async () => {
    app = await createTestServer(
      [AuthModule, UsersModule, CoursesModule],
      undefined,
      [SeedFactory, QuestionsSeeder],
    );

    const seeder = app.get(SeedFactory);

    // Create two different groups. The user will have only one of them.
    [userGroup, otherGroup] = await seeder.createMany(Group, 2);

    user = await seeder.create(User, {
      password: await hash(TEST_USER_PASSWORD, 10),
    });

    scoredUser = await seeder.create(User, {
      password: await hash(TEST_USER_PASSWORD, 10),
      groups: [userGroup],
    });

    course = await seeder.create(Course, {
      published: true,
      groups: [userGroup],
    });

    await seeder.create(CourseTranslation, {
      courseId: course.id,
      localeCode: ENGLISH_LOCALE,
      title: 'Safety Training EN',
    });

    await seeder.create(CourseTranslation, {
      courseId: course.id,
      localeCode: DUTCH_LOCALE,
      title: 'Veiligheidstraining NL',
    });

    questions = await app.get(QuestionsSeeder).seed(course, 3);

    // User answers 2 questions correctly and 1 incorrectly.
    for (let i = 0; i < questions.length; ++i) {
      const { correctAnswerId, answers } = questions[i];

      await seeder.create(UserAnswer, {
        user: scoredUser,
        question: questions[i],
        answerId:
          i !== questions.length - 1
            ? correctAnswerId!
            : answers.find((answer) => answer.id !== correctAnswerId)!.id,
      });
    }

    adminToken = await obtainAdminAuthToken(app);
    userToken = await obtainAuthToken(app, user.email, TEST_USER_PASSWORD);
    scoredUserToken = await obtainAuthToken(
      app,
      scoredUser.email,
      TEST_USER_PASSWORD,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users/:id/course-stats', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/users/${scoredUser.id}/course-stats`)
        .expect(401);
    });

    it("returns 403 when a non-admin accesses another user's scores", () => {
      return request(app.getHttpServer())
        .get(`/users/${scoredUser.id}/course-stats`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns 200 with correct score data when an admin accesses a user', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/users/${scoredUser.id}/course-stats`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(body).toMatchObject({
        data: expect.any(Array),
        total: 1,
        page: 1,
        limit: 20,
        pages: 1,
      });

      expect(body.data[0]).toMatchObject({
        id: course.id,
        questionsCount: 3,
        correctAnswersCount: 2,
        completedChaptersCount: 0,
      });
    });

    it('returns 200 when a user accesses their own scores', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/users/${scoredUser.id}/course-stats`)
        .set('Authorization', `Bearer ${scoredUserToken}`)
        .expect(200);

      expect(body.data[0]).toMatchObject({
        questionsCount: 3,
        correctAnswersCount: 2,
      });
    });

    it('only returns courses accessible to the target user', async () => {
      const otherCourse = await app.get(SeedFactory).create(Course, {
        published: true,
        groups: [otherGroup],
      });

      const { body } = await request(app.getHttpServer())
        .get(`/users/${scoredUser.id}/course-stats`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ids = (body.data as CourseDto[]).map((c) => c.id);
      expect(ids).not.toContain(otherCourse.id);
    });
  });

  describe('GET /users/:id/course-stats/download', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/users/${scoredUser.id}/course-stats/download`)
        .expect(401);
    });

    it('returns 403 when a non-admin tries to download scores', () => {
      return request(app.getHttpServer())
        .get(`/users/${scoredUser.id}/course-stats/download`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns 403 when a user tries to download their own scores', () => {
      return request(app.getHttpServer())
        .get(`/users/${scoredUser.id}/course-stats/download`)
        .set('Authorization', `Bearer ${scoredUserToken}`)
        .expect(403);
    });

    it('returns 404 when the user does not exist', () => {
      return request(app.getHttpServer())
        .get(
          `/users/00000000-0000-4000-8000-000000000000/course-stats/download`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns a CSV download with Dutch headers and course titles', async () => {
      const expectedDate = formatExpectedFilenameDate(DUTCH_LOCALE);
      const expectedFilename = `${scoredUser.name} ${scoredUser.surname} ${expectedDate}.csv`;

      const response = await request(app.getHttpServer())
        .get(`/users/${scoredUser.id}/course-stats/download`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect('Content-Type', /text\/csv/);

      expect(response.headers['content-disposition']).toBe(
        `attachment; filename="${expectedFilename}"`,
      );

      const rows = parseCsv(response.text);

      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual([
        'Cursusnaam',
        'Voltooide hoofdstukken',
        'Hoofdstukken in cursus',
        'Correct beantwoorde vragen',
        'Vragen in cursus',
      ]);
      expect(rows[1]).toEqual(['Veiligheidstraining NL', '0', '0', '2', '3']);
    });

    it('returns a header-only CSV when the user has no accessible courses', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${user.id}/course-stats/download`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const rows = parseCsv(response.text);

      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveLength(5);
      expect(rows[0][0]).toEqual('Cursusnaam');
    });
  });
});
