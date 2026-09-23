import request from 'supertest';
import { hash } from 'bcrypt';
import { In } from 'typeorm';
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
import { SeedFactory } from '@/seeder/seed.factory';
import { QuestionsSeeder } from '@/questions/questions.seeder';
import { Question } from '@/questions/entities/question.entity';
import { QuestionDto } from '@/questions/dto/question.dto';
import {
  createTestServer,
  obtainAdminAuthToken,
  obtainAuthToken,
} from './utils';

const VALID_TRANSLATIONS = [
  {
    locale: 'en',
    text: 'How to start the forklift engine?',
    explanation: 'Use forklift key to start the engine',
  },
];

const TEST_USER_PASSWORD = 'password';

describe('QuestionsController (e2e)', () => {
  let app: INestApplication<App>;

  let adminToken: string;
  let userToken: string;

  let course: Course;
  let otherCourse: Course;
  let questions: Question[];
  let otherQuestions: Question[];

  beforeAll(async () => {
    app = await createTestServer(
      [
        AuthModule,
        LocalesModule,
        CoursesModule,
        AnswersModule,
        QuestionsModule,
        GroupsModule,
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

    questions = await app.get(QuestionsSeeder).seed(course, 3);
    otherQuestions = await app.get(QuestionsSeeder).seed(otherCourse, 1);

    adminToken = await obtainAdminAuthToken(app);
    userToken = await obtainAuthToken(app, user.email, TEST_USER_PASSWORD);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /courses/:id/questions', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/courses/${course.id}/questions`)
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .get(`/courses/00000000-0000-0000-0000-000000000000/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when user does not belong to a group linked to the course', () => {
      return request(app.getHttpServer())
        .get(`/courses/${otherCourse.id}/questions`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns questions for admin regardless of group membership', () => {
      return request(app.getHttpServer())
        .get(`/courses/${otherCourse.id}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('exposes correctAnswerId only to admins', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${course.id}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body[0]).toHaveProperty('correctAnswerId');
    });

    it('returns questions for a user who belongs to a linked group', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${course.id}/questions`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveLength(3);
      expect(res.body[0]).toMatchObject({
        id: expect.any(String),
        order: expect.any(Number),
        translations: expect.any(Array),
        answers: expect.any(Array),
      });

      expect(res.body.map((question: QuestionDto) => question.id)).toEqual(
        questions.map((question) => question.id),
      );

      const question: QuestionDto = res.body[0];
      expect(question).not.toHaveProperty('correctAnswerId');
      expect(question.translations.length).toBeGreaterThan(0);
      expect(question.translations[0]).not.toHaveProperty('explanation');
      expect(question.translations[0]).toMatchObject({
        localeCode: expect.any(String),
        text: expect.any(String),
      });

      expect(question.answers.length).toBeGreaterThan(0);
      expect(question.answers[0]).toMatchObject({
        id: expect.any(String),
        translations: expect.any(Array),
      });

      expect(question.answers[0].translations.length).toBeGreaterThan(0);
      expect(question.answers[0].translations[0]).toMatchObject({
        localeCode: expect.any(String),
        text: expect.any(String),
      });
    });

    it('returns questions sorted by order ascending', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${course.id}/questions`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const orders: number[] = res.body.map((q: QuestionDto) => q.order);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    });
  });

  describe('GET /courses/:courseId/questions/:questionId', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/courses/${course.id}/questions/${questions[0].id}`)
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .get(
          `/courses/00000000-0000-0000-0000-000000000000/questions/${questions[0].id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when question does not exist', () => {
      return request(app.getHttpServer())
        .get(
          `/courses/${course.id}/questions/00000000-0000-0000-0000-000000000000`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when question belongs to a different course', () => {
      return request(app.getHttpServer())
        .get(`/courses/${course.id}/questions/${otherQuestions[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when user does not belong to a group linked to the course', () => {
      return request(app.getHttpServer())
        .get(`/courses/${otherCourse.id}/questions/${otherQuestions[0].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns a question for a user who belongs to a linked group', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${course.id}/questions/${questions[0].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: questions[0].id,
        order: expect.any(Number),
        translations: expect.any(Array),
        answers: expect.any(Array),
      });

      expect(res.body).not.toHaveProperty('correctAnswerId');

      expect(res.body.translations.length).toBeGreaterThan(0);
      expect(res.body.translations[0]).not.toHaveProperty('explanation');
      expect(res.body.translations[0]).toMatchObject({
        localeCode: expect.any(String),
        text: expect.any(String),
      });

      expect(res.body.answers.length).toBeGreaterThan(0);
      expect(res.body.answers[0]).toMatchObject({
        id: expect.any(String),
        translations: expect.any(Array),
      });
    });
  });

  describe('POST /courses/:id/questions', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/questions`)
        .send({ translations: VALID_TRANSLATIONS })
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .post(`/courses/00000000-0000-0000-0000-000000000000/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: VALID_TRANSLATIONS })
        .expect(404);
    });

    it('returns 400 when body is empty', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });

    it('returns 400 when translations array is empty', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: [] })
        .expect(400);
    });

    it('returns 400 when translations contain duplicate locales', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: [
            ...VALID_TRANSLATIONS,
            {
              locale: 'en',
              text: 'Duplicate text',
              explanation: 'Duplication explanation',
            },
          ],
        })
        .expect(400);
    });

    it('returns 403 when non-admin tries to create a quiz question', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/questions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ translations: VALID_TRANSLATIONS })
        .expect(403);
    });

    it('creates a quiz question associated with the existing course', async () => {
      const res = await request(app.getHttpServer())
        .post(`/courses/${course.id}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: VALID_TRANSLATIONS, order: 5 });

      expect(res.body).toMatchObject({
        id: expect.any(String),
        courseId: course.id,
        order: 5,
        translations: expect.any(Array),
        answers: [],
      });

      expect(res.body.translations).toHaveLength(1);
      expect(res.body.translations[0]).toMatchObject({
        localeCode: 'en',
        text: VALID_TRANSLATIONS[0].text,
        explanation: VALID_TRANSLATIONS[0].explanation,
      });
    });

    it('creates a chapter with multiple translations', async () => {
      const res = await request(app.getHttpServer())
        .post(`/courses/${course.id}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: [
            ...VALID_TRANSLATIONS,
            {
              locale: 'nl',
              text: 'Dutch text',
              explanation: 'Dutch explanation',
            },
          ],
        })
        .expect(201);

      expect(res.body.translations).toHaveLength(2);
    });
  });

  describe('PATCH /courses/:courseId/questions/:id', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .patch(`/courses/${course.id}/questions/${questions[0].id}`)
        .send({})
        .expect(401);
    });

    it('returns 403 when non-admin user tries to update a question', () => {
      return request(app.getHttpServer())
        .patch(`/courses/${course.id}/questions/${questions[0].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order: 10 })
        .expect(403);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .patch(
          `/courses/00000000-0000-0000-0000-000000000000/questions/${questions[0].id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(404);
    });

    it('returns 404 when question does not exist', () => {
      return request(app.getHttpServer())
        .patch(
          `/courses/${course.id}/questions/00000000-0000-0000-0000-000000000000`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(404);
    });

    it('returns 404 when question belongs to a different course', () => {
      return request(app.getHttpServer())
        .patch(`/courses/${otherCourse.id}/questions/${questions[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(404);
    });

    it('returns 200 even when body is empty (no changes)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/courses/${course.id}/questions/${questions[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(200);

      const body = res.body as QuestionDto;

      expect(body).toMatchObject({
        id: questions[0].id,
        courseId: course.id,
        order: expect.any(Number),
        correctAnswerId: expect.anything(),
        translations: expect.any(Array),
        answers: expect.any(Array),
      });

      expect(body.translations.length).toBeGreaterThan(0);
      expect(body.translations[0]).toMatchObject({
        localeCode: expect.any(String),
        text: expect.any(String),
      });

      expect(body.answers.length).toBeGreaterThan(0);
      expect(body.answers[0]).toMatchObject({
        id: expect.any(String),
        translations: expect.any(Array),
      });
    });

    it('updates the question order', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/courses/${course.id}/questions/${questions[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ order: 99 })
        .expect(200);

      expect(body.order).toBe(99);
    });

    it('updates existing translations', async () => {
      const translation = {
        text: 'Updated question text',
        explanation: 'Updated explanation',
      };

      const { body } = await request(app.getHttpServer())
        .patch(`/courses/${course.id}/questions/${questions[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: [{ locale: 'en', ...translation }] })
        .expect(200);

      expect(body.translations).toContainEqual({
        ...translation,
        localeCode: 'en',
      });
    });

    it('creates a new translation during update when locale does not exist', async () => {
      const { body: question } = await request(app.getHttpServer())
        .post(`/courses/${course.id}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: [{ text: 'English text', locale: 'en' }] })
        .expect(201);

      const dutch = {
        text: 'Dutch text',
        explanation: 'Dutch explanation',
      };

      const { body } = await request(app.getHttpServer())
        .patch(`/courses/${course.id}/questions/${question.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: [{ locale: 'nl', ...dutch }] })
        .expect(200);

      expect(body.translations).toHaveLength(2);
      expect(body.translations).toContainEqual({ ...dutch, localeCode: 'nl' });
    });

    it('updates correctAnswerId when the answer belongs to the question', async () => {
      const answer = questions[0].answers[0];

      const { body } = await request(app.getHttpServer())
        .patch(`/courses/${course.id}/questions/${questions[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ correctAnswerId: answer.id })
        .expect(200);

      expect(body.correctAnswerId).toBe(answer.id);
    });

    it('returns 400 when correctAnswerId belongs to a different question', () => {
      return request(app.getHttpServer())
        .patch(`/courses/${course.id}/questions/${questions[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ correctAnswerId: questions[2].answers[0].id })
        .expect(400);
    });
  });

  describe('DELETE /courses/:courseId/questions/:questionId', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .delete(`/courses/${course.id}/questions/${questions[0].id}`)
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .delete(
          `/courses/00000000-0000-0000-0000-000000000000/questions/${questions[0].id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when question does not belong to the course', () => {
      return request(app.getHttpServer())
        .delete(`/courses/${course.id}/questions/${otherQuestions[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when question does not exist', () => {
      return request(app.getHttpServer())
        .delete(
          `/courses/${course.id}/questions/00000000-0000-0000-0000-000000000000`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when non-admin attempts to delete a quiz question', () => {
      return request(app.getHttpServer())
        .delete(`/courses/${course.id}/questions/${questions[0].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns a deleted quiz question with all related data removed', async () => {
      const questionToDelete = questions[1];

      const questionTranslationRepo = app.get('QuestionTranslationRepository');
      const answerRepo = app.get('AnswerRepository');
      const answerTranslationRepo = app.get('AnswerTranslationRepository');

      await request(app.getHttpServer())
        .delete(`/courses/${course.id}/questions/${questionToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // verify that question was deleted
      await request(app.getHttpServer())
        .get(`/courses/${course.id}/questions/${questionToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      // verify that question translations, answers and answer translations were deleted
      const [translations, answers, answerTranslations] = await Promise.all([
        questionTranslationRepo.find({
          where: { questionId: questionToDelete.id },
        }),
        answerRepo.find({
          where: { questionId: questionToDelete.id },
        }),
        answerTranslationRepo.find({
          where: { answerId: In(questionToDelete.answers.map((a) => a.id)) },
        }),
      ]);

      expect(translations).toHaveLength(0);
      expect(answers).toHaveLength(0);
      expect(answerTranslations).toHaveLength(0);
    });
  });
});
