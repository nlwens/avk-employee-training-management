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
import { Course } from '@/courses/entities/course.entity';
import { Group } from '@/groups/entities/group.entity';
import { User } from '@/users/entities/user.entity';
import { Question } from '@/questions/entities/question.entity';
import { Answer } from '@/answers/entities/answer.entity';
import { SeedFactory } from '@/seeder/seed.factory';
import { QuestionsSeeder } from '@/questions/questions.seeder';
import { AnswerDto } from '@/answers/dto/answer.dto';
import { UsersModule } from '@/users/users.module';
import {
  createTestServer,
  obtainAdminAuthToken,
  obtainAuthToken,
} from './utils';

const TEST_USER_PASSWORD = 'password';

const INVALID_UUID = '00000000-0000-0000-0000-000000000000';
const VALID_TRANSLATIONS = [
  {
    locale: 'en',
    text: 'This is the correct answer to the question',
  },
];

describe('AnswersController (e2e)', () => {
  let app: INestApplication<App>;

  let adminToken: string;
  let userToken: string;

  let course: Course;
  let otherCourse: Course;
  let question: Question;
  let otherQuestion: Question;
  let answer: Answer;

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
      [SeedFactory, QuestionsSeeder],
    );

    const factory = app.get(SeedFactory);

    // Create two different groups. The user will have only one of them.
    const [userGroup, otherGroup] = await factory.createMany(Group, 2);

    const user = await factory.create(User, {
      password: await hash(TEST_USER_PASSWORD, 10),
      groups: [userGroup],
    });

    // Create two courses with different groups. The user can access only one.
    course = await factory.create(Course, { groups: [userGroup] });
    otherCourse = await factory.create(Course, { groups: [otherGroup] });

    // Each course should have one question so that we can check the user can
    // access only one of them while the administrator can access both.
    [question] = await app.get(QuestionsSeeder).seed(course, 1);
    [otherQuestion] = await app.get(QuestionsSeeder).seed(otherCourse, 1);

    // The seeder for questions also creates answers for them.
    answer = question.answers[0];

    adminToken = await obtainAdminAuthToken(app);
    userToken = await obtainAuthToken(app, user.email, TEST_USER_PASSWORD);
  });

  afterAll(async () => {
    await app.close();
  });

  const answerUrl = (courseId: string, questionId: string, answerId: string) =>
    `/courses/${courseId}/questions/${questionId}/answers/${answerId}` as const;

  describe('GET /courses/:courseId/questions/:questionId/answers', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/courses/${course.id}/questions/${question.id}/answers`)
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .get(`/courses/${INVALID_UUID}/questions/${question.id}/answers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when question does not exist', () => {
      return request(app.getHttpServer())
        .get(`/courses/${course.id}/questions/${INVALID_UUID}/answers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when question does not belong to the course', () => {
      return request(app.getHttpServer())
        .get(`/courses/${course.id}/questions/${otherQuestion.id}/answers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when the user cannot access the course', () => {
      return request(app.getHttpServer())
        .get(`/courses/${otherCourse.id}/questions/${otherQuestion.id}/answers`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns 200 with the list of answers', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${course.id}/questions/${question.id}/answers`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const answers = res.body as AnswerDto[];

      expect(answers).toContainEqual({
        id: answer.id,
        questionId: question.id,
        translations: expect.any(Array),
      });
      expect(answers[0].translations).toContainEqual({
        localeCode: expect.any(String),
        text: expect.any(String),
      });

      // Verify that there are no question answers with a different question ID.
      expect(answers.every((a) => a.questionId === question.id)).toBe(true);
    });
  });

  describe('POST /courses/:courseId/questions/:questionId/answers', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/questions/${question.id}/answers`)
        .send({ translations: VALID_TRANSLATIONS })
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .post(`/courses/${INVALID_UUID}/questions/${question.id}/answers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: VALID_TRANSLATIONS })
        .expect(404);
    });

    it('returns 404 when question does not exist', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/questions/${INVALID_UUID}/answers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: VALID_TRANSLATIONS })
        .expect(404);
    });

    it('returns 404 when question does not belong to the course', async () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/questions/${otherQuestion.id}/answers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: VALID_TRANSLATIONS })
        .expect(404);
    });

    it('returns 403 when non-admin user tries to create a new answer', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/questions/${question.id}/answers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ translations: VALID_TRANSLATIONS })
        .expect(403);
    });

    it('returns 201 when admin creates adds a new answer for the question', async () => {
      const res = await request(app.getHttpServer())
        .post(`/courses/${course.id}/questions/${question.id}/answers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: VALID_TRANSLATIONS })
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(String),
        questionId: question.id,
        translations: expect.any(Array),
      });

      expect(res.body.translations).toContainEqual({
        localeCode: VALID_TRANSLATIONS[0].locale,
        text: VALID_TRANSLATIONS[0].text,
      });
    });

    it('returns 201 when admin creates an answer with multiple translations', async () => {
      const res = await request(app.getHttpServer())
        .post(`/courses/${course.id}/questions/${question.id}/answers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: [
            ...VALID_TRANSLATIONS,
            { locale: 'nl', text: 'Dutch answer' },
          ],
        })
        .expect(201);

      expect(res.body.translations).toHaveLength(2);
    });
  });

  describe('PATCH /courses/:courseId/questions/:questionId/answers/:id', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .patch(answerUrl(course.id, question.id, answer.id))
        .send({ translations: [{ locale: 'en', text: 'text' }] })
        .expect(401);
    });

    it('returns 403 when non-admin user tries to update an answer', () => {
      return request(app.getHttpServer())
        .patch(answerUrl(course.id, question.id, answer.id))
        .set('Authorization', `Bearer ${userToken}`)
        .send({ translations: [{ locale: 'en', text: 'text' }] })
        .expect(403);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .patch(answerUrl(INVALID_UUID, question.id, answer.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: [{ locale: 'en', text: 'text' }] })
        .expect(404);
    });

    it('returns 404 when question does not exist', () => {
      return request(app.getHttpServer())
        .patch(answerUrl(course.id, INVALID_UUID, answer.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: [{ locale: 'en', text: 'text' }] })
        .expect(404);
    });

    it('returns 404 when question belongs to a different course', () => {
      return request(app.getHttpServer())
        .patch(answerUrl(otherCourse.id, question.id, answer.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: [{ locale: 'en', text: 'text' }] })
        .expect(404);
    });

    it('returns 404 when answer does not exist', () => {
      return request(app.getHttpServer())
        .patch(answerUrl(course.id, question.id, INVALID_UUID))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: [{ locale: 'en', text: 'text' }] })
        .expect(404);
    });

    it('returns 404 when answer belongs to a different question', () => {
      return request(app.getHttpServer())
        .patch(answerUrl(course.id, question.id, otherQuestion.answers[0].id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: [{ locale: 'en', text: 'text' }] })
        .expect(404);
    });

    it('returns 200 with the updated answer shape', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(answerUrl(course.id, question.id, answer.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: [{ locale: 'en', text: 'some text' }] })
        .expect(200);

      expect(body).toMatchObject({
        id: answer.id,
        questionId: question.id,
        translations: expect.any(Array),
      });

      expect(body.translations).toContainEqual({
        localeCode: 'en',
        text: 'some text',
      });
    });

    it('updates an existing translation', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(answerUrl(course.id, question.id, answer.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: [{ locale: 'en', text: 'Updated text' }] })
        .expect(200);

      expect(body.translations).toContainEqual({
        localeCode: 'en',
        text: 'Updated text',
      });
    });

    it('creates a new translation when locale does not exist yet', async () => {
      const { body: answer } = await request(app.getHttpServer())
        .post(`/courses/${course.id}/questions/${question.id}/answers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: [{ locale: 'en', text: 'English' }] })
        .expect(201);

      const { body } = await request(app.getHttpServer())
        .patch(answerUrl(course.id, question.id, answer.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: [{ locale: 'nl', text: 'Dutch text' }] })
        .expect(200);

      expect(body.translations).toHaveLength(2);
      expect(body.translations).toContainEqual({
        localeCode: 'en',
        text: 'English',
      });
      expect(body.translations).toContainEqual({
        localeCode: 'nl',
        text: 'Dutch text',
      });
    });

    it('returns 400 when translations array is empty', () => {
      return request(app.getHttpServer())
        .patch(answerUrl(course.id, question.id, answer.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: [] })
        .expect(400);
    });

    it('returns 400 when translations contain duplicate locales', () => {
      return request(app.getHttpServer())
        .patch(answerUrl(course.id, question.id, answer.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: [
            { locale: 'en', text: 'First' },
            { locale: 'en', text: 'Duplicate' },
          ],
        })
        .expect(400);
    });

    it('returns 200 with no changes when body is empty', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(answerUrl(course.id, question.id, answer.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(200);

      expect(body).toMatchObject({
        id: answer.id,
        questionId: question.id,
        translations: expect.any(Array),
      });
    });
  });

  describe('DELETE /courses/:courseId/questions/:questionId/answers/:id', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .delete(answerUrl(course.id, question.id, answer.id))
        .expect(401);
    });

    it('returns 403 when non-admin user tries to delete an answer', () => {
      return request(app.getHttpServer())
        .delete(answerUrl(course.id, question.id, answer.id))
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .delete(answerUrl(INVALID_UUID, question.id, answer.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when question does not exist', () => {
      return request(app.getHttpServer())
        .delete(answerUrl(course.id, INVALID_UUID, answer.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when question belongs to a different course', () => {
      return request(app.getHttpServer())
        .delete(answerUrl(otherCourse.id, question.id, answer.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when answer does not exist', () => {
      return request(app.getHttpServer())
        .delete(answerUrl(course.id, question.id, INVALID_UUID))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when answer belongs to a different question', () => {
      return request(app.getHttpServer())
        .delete(answerUrl(course.id, question.id, otherQuestion.answers[0].id))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 204 and deletes the answer with all associated data', async () => {
      const [freshQuestion] = await app.get(QuestionsSeeder).seed(course, 1);
      const answerToDelete = freshQuestion.answers[0];

      await request(app.getHttpServer())
        .delete(answerUrl(course.id, freshQuestion.id, answerToDelete.id))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Verify the answer is no longer listed.
      const { body: remaining } = await request(app.getHttpServer())
        .get(`/courses/${course.id}/questions/${freshQuestion.id}/answers`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(
        remaining.every((a: AnswerDto) => a.id !== answerToDelete.id),
      ).toBe(true);
    });
  });
});
