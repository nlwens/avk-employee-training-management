import request from 'supertest';
import { hash } from 'bcrypt';
import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { AuthModule } from '@/auth/auth.module';
import { AnswersModule } from '@/answers/answers.module';
import { QuestionsModule } from '@/questions/questions.module';
import { CoursesModule } from '@/courses/courses.module';
import { GroupsModule } from '@/groups/groups.module';
import { LocalesModule } from '@/locales/locales.module';
import { UsersModule } from '@/users/users.module';
import { Course } from '@/courses/entities/course.entity';
import { Group } from '@/groups/entities/group.entity';
import { User } from '@/users/entities/user.entity';
import { Question } from '@/questions/entities/question.entity';
import { SeedFactory } from '@/seeder/seed.factory';
import { QuestionsSeeder } from '@/questions/questions.seeder';
import { UserAnswersSeeder } from '@/answers/user-answers.seeder';
import {
  createTestServer,
  obtainAdminAuthToken,
  obtainAuthToken,
} from './utils';

const TEST_USER_PASSWORD = 'password';

describe('UserAnswersController (e2e)', () => {
  let app: INestApplication<App>;

  let adminToken: string;
  let userToken: string;

  let course: Course;
  let otherCourse: Course;
  let question: Question;
  let otherQuestion: Question;
  let otherCourseQuestion: Question;

  beforeAll(async () => {
    app = await createTestServer(
      [
        AuthModule,
        LocalesModule,
        CoursesModule,
        AnswersModule,
        QuestionsModule,
        GroupsModule,
        UsersModule,
      ],
      undefined,
      [SeedFactory, QuestionsSeeder, UserAnswersSeeder],
    );

    const factory = app.get(SeedFactory);

    // Create two different groups. The user will have only one of them.
    const [userGroup, otherGroup] = await factory.createMany(Group, 2);

    // Create two users so that we can test that different users can answer the same question.
    const user = await factory.create(User, {
      password: await hash(TEST_USER_PASSWORD, 10),
      groups: [userGroup],
    });

    course = await factory.create(Course, { groups: [userGroup] });
    otherCourse = await factory.create(Course, { groups: [otherGroup] });

    [question, otherQuestion] = await app.get(QuestionsSeeder).seed(course, 2);
    [otherCourseQuestion] = await app.get(QuestionsSeeder).seed(otherCourse, 1);

    adminToken = await obtainAdminAuthToken(app);
    userToken = await obtainAuthToken(app, user.email, TEST_USER_PASSWORD);
  });

  afterAll(async () => {
    await app.close();
  });

  const userAnswers = (courseId: string, questionId: string) =>
    `/courses/${courseId}/questions/${questionId}/user-answers` as const;

  describe('POST /courses/:courseId/questions/:questionId/user-answers', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .post(userAnswers(course.id, question.id))
        .send({ answerId: question.answers[0].id })
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .post(userAnswers('00000000-0000-0000-0000-000000000000', question.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ answerId: question.answers[0].id })
        .expect(404);
    });

    it('returns 404 when question does not exist', () => {
      return request(app.getHttpServer())
        .post(userAnswers(course.id, '00000000-0000-0000-0000-000000000000'))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ answerId: question.answers[0].id })
        .expect(404);
    });

    it('returns 404 when question does not belong to the course', async () => {
      const [freshQuestion] = await app
        .get(QuestionsSeeder)
        .seed(otherCourse, 1);

      return request(app.getHttpServer())
        .post(userAnswers(course.id, freshQuestion.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ answerId: freshQuestion.answers[0].id })
        .expect(404);
    });

    it('returns 403 when user does not belong to a group linked to the course', async () => {
      const [freshQuestion] = await app
        .get(QuestionsSeeder)
        .seed(otherCourse, 1);

      return request(app.getHttpServer())
        .post(userAnswers(otherCourse.id, freshQuestion.id))
        .set('Authorization', `Bearer ${userToken}`)
        .send({ answerId: freshQuestion.answers[0].id })
        .expect(403);
    });

    it('returns 400 when answerId does not exist in the database', () => {
      return request(app.getHttpServer())
        .post(userAnswers(course.id, question.id))
        .set('Authorization', `Bearer ${userToken}`)
        .send({ answerId: '00000000-0000-0000-0000-000000000000' })
        .expect(400);
    });

    it('returns 400 when answer exists but does not belong to the question', () => {
      return request(app.getHttpServer())
        .post(userAnswers(course.id, question.id))
        .set('Authorization', `Bearer ${userToken}`)
        .send({ answerId: otherQuestion.answers[0].id })
        .expect(400);
    });

    it('returns 409 when user has already answered the question', async () => {
      const [freshQuestion] = await app.get(QuestionsSeeder).seed(course, 1);

      await request(app.getHttpServer())
        .post(userAnswers(course.id, freshQuestion.id))
        .set('Authorization', `Bearer ${userToken}`)
        .send({ answerId: freshQuestion.answers[0].id })
        .expect(200);

      return request(app.getHttpServer())
        .post(userAnswers(course.id, freshQuestion.id))
        .set('Authorization', `Bearer ${userToken}`)
        .send({ answerId: freshQuestion.answers[0].id })
        .expect(409);
    });

    it('returns 200 with correctAnswerId and explanation', async () => {
      const [freshQuestion] = await app.get(QuestionsSeeder).seed(course, 1);

      const res = await request(app.getHttpServer())
        .post(userAnswers(course.id, freshQuestion.id))
        .set('Authorization', `Bearer ${userToken}`)
        .send({ answerId: freshQuestion.answers[0].id })
        .expect(200);

      expect(res.body).toMatchObject({
        correctAnswerId: freshQuestion.correctAnswerId,
        explanation: expect.any(Object),
      });

      expect(Object.keys(res.body.explanation).length).toBeGreaterThan(0);
    });

    it('allows different users to answer the same question', async () => {
      const [freshQuestion] = await app.get(QuestionsSeeder).seed(course, 1);

      await request(app.getHttpServer())
        .post(userAnswers(course.id, freshQuestion.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ answerId: freshQuestion.answers[0].id })
        .expect(200);

      return request(app.getHttpServer())
        .post(userAnswers(course.id, freshQuestion.id))
        .set('Authorization', `Bearer ${userToken}`)
        .send({ answerId: freshQuestion.answers[0].id })
        .expect(200);
    });
  });

  describe('GET /courses/:courseId/questions/:questionId/user-answers', () => {
    it('returns 401 when no token is provided', async () => {
      return request(app.getHttpServer())
        .get(userAnswers(course.id, question.id))
        .expect(401);
    });

    it('returns 404 when course does not exist', async () => {
      return request(app.getHttpServer())
        .get(userAnswers('00000000-0000-0000-0000-000000000000', question.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when question does not exist', async () => {
      return request(app.getHttpServer())
        .get(userAnswers(course.id, '00000000-0000-0000-0000-000000000000'))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when question does not belong to the course', async () => {
      const [freshQuestion] = await app
        .get(QuestionsSeeder)
        .seed(otherCourse, 1);

      return request(app.getHttpServer())
        .get(userAnswers(course.id, freshQuestion.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when employee does not belong to a group linked to the course', async () => {
      const [freshQuestion] = await app
        .get(QuestionsSeeder)
        .seed(otherCourse, 1);

      return request(app.getHttpServer())
        .get(userAnswers(otherCourse.id, freshQuestion.id))
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns empty array for employee who has not answered the question', async () => {
      const [freshQuestion] = await app.get(QuestionsSeeder).seed(course, 1);

      const res = await request(app.getHttpServer())
        .get(userAnswers(course.id, freshQuestion.id))
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('returns single-item array with the employee answer after answering', async () => {
      const [freshQuestion] = await app.get(QuestionsSeeder).seed(course, 1);

      await request(app.getHttpServer())
        .post(userAnswers(course.id, freshQuestion.id))
        .set('Authorization', `Bearer ${userToken}`)
        .send({ answerId: freshQuestion.answers[0].id })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(userAnswers(course.id, freshQuestion.id))
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        answerId: freshQuestion.answers[0].id,
        correctAnswerId: freshQuestion.correctAnswerId,
        userId: expect.any(String),
        explanation: expect.any(Object),
        createdAt: expect.any(String),
      });

      expect(Object.keys(res.body[0].explanation).length).toBeGreaterThan(0);
    });

    it('returns all answers with userId for admin when multiple users have answered', async () => {
      const [freshQuestion] = await app.get(QuestionsSeeder).seed(course, 1);
      await app.get(UserAnswersSeeder).seed(freshQuestion, 2);

      const res = await request(app.getHttpServer())
        .get(userAnswers(course.id, freshQuestion.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toMatchObject({
        answerId: expect.any(String),
        correctAnswerId: freshQuestion.correctAnswerId,
        explanation: expect.any(Object),
        createdAt: expect.any(String),
        userId: expect.any(String),
      });
    });
  });

  describe('DELETE /courses/:courseId/questions/:questionId/user-answers/:userId', () => {
    const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';

    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .delete(`${userAnswers(course.id, question.id)}/${NON_EXISTENT_ID}`)
        .expect(401);
    });

    it('returns 403 when the requester is not an administrator', () => {
      return request(app.getHttpServer())
        .delete(`${userAnswers(course.id, question.id)}/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .delete(
          `${userAnswers(NON_EXISTENT_ID, question.id)}/${NON_EXISTENT_ID}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when question does not exist', () => {
      return request(app.getHttpServer())
        .delete(`${userAnswers(course.id, NON_EXISTENT_ID)}/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when question does not belong to the course', () => {
      return request(app.getHttpServer())
        .delete(
          `${userAnswers(course.id, otherCourseQuestion.id)}/${NON_EXISTENT_ID}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when there is no user answer for the question', () => {
      return request(app.getHttpServer())
        .delete(`${userAnswers(course.id, question.id)}/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('deletes the user answer and returns 204', async () => {
      await request(app.getHttpServer())
        .post(userAnswers(course.id, otherQuestion.id))
        .set('Authorization', `Bearer ${userToken}`)
        .send({ answerId: otherQuestion.answers[0].id })
        .expect(200);

      const before = await request(app.getHttpServer())
        .get(userAnswers(course.id, otherQuestion.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const { userId } = before.body[0];

      await request(app.getHttpServer())
        .delete(`${userAnswers(course.id, otherQuestion.id)}/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const after = await request(app.getHttpServer())
        .get(userAnswers(course.id, otherQuestion.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(after.body).toEqual([]);
    });
  });
});
