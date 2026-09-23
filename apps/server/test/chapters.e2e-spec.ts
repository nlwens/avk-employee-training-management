import request from 'supertest';
import { hash } from 'bcrypt';
import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { AuthModule } from '@/auth/auth.module';
import { ChaptersModule } from '@/chapters/chapters.module';
import { CoursesModule } from '@/courses/courses.module';
import { GroupsModule } from '@/groups/groups.module';
import { LocalesModule } from '@/locales/locales.module';
import { Course } from '@/courses/entities/course.entity';
import { Group } from '@/groups/entities/group.entity';
import { User } from '@/users/entities/user.entity';
import { SeedFactory } from '@/seeder/seed.factory';
import { ChaptersSeeder } from '@/chapters/chapters.seeder';
import { ChapterDto } from '@/chapters/dto/chapter.dto';
import { SegmentsSeeder } from '@/segments/segments.seeder';
import {
  createTestServer,
  obtainAdminAuthToken,
  obtainAuthToken,
} from './utils';
import { Chapter } from '@/chapters/entities/chapter.entity';
import { SegmentsModule } from '@/segments/segments.module';

const VALID_TRANSLATIONS = [
  {
    locale: 'en',
    title: 'Operations Basics',
  },
];

const TEST_USER_PASSWORD = 'password';

describe('ChaptersController (e2e)', () => {
  let app: INestApplication<App>;

  let adminToken: string;
  let userToken: string;

  let course: Course;
  let otherCourse: Course;
  let unpublishedCourseWithUserGroup: Course;

  let chapters: Chapter[];
  let unpublishedChapters: Chapter[];

  beforeAll(async () => {
    app = await createTestServer(
      [
        AuthModule,
        LocalesModule,
        CoursesModule,
        ChaptersModule,
        SegmentsModule,
        GroupsModule,
      ],
      undefined,
      [SeedFactory, ChaptersSeeder, SegmentsSeeder],
    );

    const factory = app.get(SeedFactory);

    // Create two different groups. The user will have only one of them.
    const [userGroup, otherGroup] = await factory.createMany(Group, 2);

    const user = await factory.create(User, {
      password: await hash(TEST_USER_PASSWORD, 10),
      groups: [userGroup],
    });

    // Create two courses with a different group. The user can see only one.
    course = await factory.create(Course, { groups: [userGroup] });
    otherCourse = await factory.create(Course, { groups: [otherGroup] });

    unpublishedCourseWithUserGroup = await factory.create(Course, {
      published: false,
      groups: [userGroup],
    });

    // We are interested in testing chapters only for the course the user can see.
    chapters = await app.get(ChaptersSeeder).seed(course, 3);
    unpublishedChapters = await app
      .get(ChaptersSeeder)
      .seed(unpublishedCourseWithUserGroup, 2);

    adminToken = await obtainAdminAuthToken(app);
    userToken = await obtainAuthToken(app, user.email, TEST_USER_PASSWORD);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /courses/:id/chapters', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/courses/${course.id}/chapters`)
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .get(`/courses/00000000-0000-0000-0000-000000000000/chapters`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when user does not belong to a group linked to the course', () => {
      return request(app.getHttpServer())
        .get(`/courses/${otherCourse.id}/chapters`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns chapters for admin regardless of group membership', () => {
      return request(app.getHttpServer())
        .get(`/courses/${otherCourse.id}/chapters`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('returns chapters for a user who belongs to a linked group', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${course.id}/chapters`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveLength(3);
      expect(res.body[0]).toMatchObject({
        id: expect.any(String),
        order: expect.any(Number),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        translations: expect.any(Array),
      });
      expect(res.body[0].translations.length).toBeGreaterThan(0);
      expect(res.body[0].translations[0]).toMatchObject({
        localeCode: expect.any(String),
        title: expect.any(String),
      });
    });

    it('returns chapters ordered by order field ascending', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${course.id}/chapters`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const orders: number[] = res.body.map(
        (chapter: ChapterDto) => chapter.order,
      );
      expect(orders).toEqual(orders.toSorted());
    });

    it('returns 403 when non-admin tries to access chapters of unpublished course', () => {
      return request(app.getHttpServer())
        .get(`/courses/${unpublishedCourseWithUserGroup.id}/chapters`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('admin can access chapters of unpublished course', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${unpublishedCourseWithUserGroup.id}/chapters`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toMatchObject({
        id: expect.any(String),
        order: expect.any(Number),
        translations: expect.any(Array),
      });
    });
  });

  describe('GET /courses/:courseId/chapters/:chapterId', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/courses/${course.id}/chapters/${chapters[0].id}`)
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .get(
          `/courses/00000000-0000-0000-0000-000000000000/chapters/${chapters[0].id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when chapter does not exist', () => {
      return request(app.getHttpServer())
        .get(
          `/courses/${course.id}/chapters/00000000-0000-0000-0000-000000000000`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns chapter details for admin regardless of group membership', () => {
      return request(app.getHttpServer())
        .get(`/courses/${course.id}/chapters/${chapters[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('returns chapter details for a user who belongs to a linked group', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${course.id}/chapters/${chapters[0].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: chapters[0].id,
        courseId: course.id,
        order: expect.any(Number),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        translations: expect.any(Array),
      });
      expect(res.body.translations.length).toBeGreaterThan(0);
      expect(res.body.translations[0]).toMatchObject({
        title: expect.any(String),
      });
    });

    it('returns 403 when non-admin tries to access chapter details of unpublished course', () => {
      return request(app.getHttpServer())
        .get(
          `/courses/${unpublishedCourseWithUserGroup.id}/chapters/${unpublishedChapters[0].id}`,
        )
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('admin can access chapter details of unpublished course', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/courses/${unpublishedCourseWithUserGroup.id}/chapters/${unpublishedChapters[0].id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: unpublishedChapters[0].id,
        order: expect.any(Number),
        translations: expect.any(Array),
      });
    });
  });

  describe('POST /courses/:id/chapters', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters`)
        .send({ translations: VALID_TRANSLATIONS })
        .expect(401);
    });

    it('returns 400 when translations are missing', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ order: 1 })
        .expect(400);
    });

    it('returns 400 when order is missing', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: VALID_TRANSLATIONS })
        .expect(400);
    });

    it('returns 400 when translations array is empty', () => {
      return request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ order: 1, translations: [] })
        .expect(400);
    });

    it('returns 400 when a translation title is missing', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ order: 1, translations: [{ locale: 'en' }] })
        .expect(400);
    });

    it('returns 400 when translations contain duplicate locales', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          order: 1,
          translations: [
            { locale: 'en', title: 'First' },
            { locale: 'en', title: 'Second' },
          ],
        })
        .expect(400);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .post(`/courses/00000000-0000-0000-0000-000000000000/chapters`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          order: 1,
          translations: VALID_TRANSLATIONS,
        })
        .expect(404);
    });

    it('returns 403 when non-admin user is trying to create a chapter', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order: 1, translations: VALID_TRANSLATIONS })
        .expect(403);
    });

    it('creates a chapter associated with an existing course', async () => {
      const res = await request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          order: 2,
          translations: VALID_TRANSLATIONS,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.order).toBe(2);
      expect(res.body.translations).toHaveLength(1);
      expect(res.body.translations[0].title).toBe(VALID_TRANSLATIONS[0].title);
    });

    it('creates a chapter with multiple translations', async () => {
      const res = await request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          order: 1,
          translations: [
            ...VALID_TRANSLATIONS,
            { locale: 'nl', title: 'Dutch title' },
          ],
        })
        .expect(201);

      expect(res.body.translations).toHaveLength(2);
    });
  });

  describe('PATCH /courses/:courseId/chapters/:chapterId', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .patch(`/courses/${course.id}/chapters/${chapters[0].id}`)
        .send({ translations: VALID_TRANSLATIONS })
        .expect(401);
    });

    it('returns 403 when non-admin user is trying to update a chapter', () => {
      return request(app.getHttpServer())
        .patch(`/courses/${course.id}/chapters/${chapters[0].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order: 1, translations: VALID_TRANSLATIONS })
        .expect(403);
    });

    it('returns 404 when chapter does not exist', () => {
      return request(app.getHttpServer())
        .patch(
          `/courses/${course.id}/chapters/00000000-0000-0000-0000-000000000000`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          order: 1,
          translations: VALID_TRANSLATIONS,
        })
        .expect(404);
    });

    it('returns 404 even when chapter is not associated with a group', () => {
      return request(app.getHttpServer())
        .patch(`/courses/${otherCourse.id}/chapters/${chapters[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          order: 1,
          translations: VALID_TRANSLATIONS,
        })
        .expect(404);
    });

    it('returns 200 even when body attributes are missing (no updates)', () => {
      return request(app.getHttpServer())
        .patch(`/courses/${course.id}/chapters/${chapters[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(200);
    });

    it('updates a chapter associated to the existing course', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/courses/${course.id}/chapters/${chapters[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: [
            {
              locale: 'en',
              title: 'Updated title',
            },
            {
              locale: 'nl',
              title: 'Updated title in dutch',
            },
          ],
        })
        .expect(200);

      expect(res.body.translations[0].title).toBe('Updated title');
      expect(res.body.translations[1].title).toBe('Updated title in dutch');
    });

    it('creates during the update a new translation if it does not exist', async () => {
      await request(app.getHttpServer())
        .patch(`/courses/${course.id}/chapters/${chapters[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: [
            {
              locale: 'en',
              title: 'English title',
            },
          ],
        })
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch(`/courses/${course.id}/chapters/${chapters[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: [
            {
              locale: 'nl',
              title: 'Dutch title',
            },
          ],
        })
        .expect(200);

      expect(res.body.translations).toHaveLength(2);
      expect(res.body.translations[0].title).toBe('English title');
      expect(res.body.translations[1].title).toBe('Dutch title');
    });
  });

  describe('DELETE /courses/:courseId/chapters/:chapterId', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .delete(`/courses/${course.id}/chapters/${chapters[0].id}`)
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .delete(
          `/courses/00000000-0000-0000-0000-000000000000/chapters/${chapters[0].id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when chapter does not exist', () => {
      return request(app.getHttpServer())
        .delete(
          `/courses/${course.id}/chapters/00000000-0000-0000-0000-000000000000`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when non-admin attempts to delete a course', () => {
      return request(app.getHttpServer())
        .delete(`/courses/${course.id}/chapters/${chapters[0].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('deletes a chapter and all related data', async () => {
      const segmentRepo = app.get('SegmentRepository');

      // delete the chapter, and verify whether it was deleted
      await request(app.getHttpServer())
        .delete(`/courses/${course.id}/chapters/${chapters[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .delete(`/courses/${course.id}/chapters/${chapters[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      // verify segments are deleted with cascade
      const deletedSegments = await segmentRepo.find({
        where: { chapterId: chapters[0].id },
      });

      expect(deletedSegments).toHaveLength(0);
    });
  });
});
