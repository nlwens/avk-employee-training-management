import request from 'supertest';
import { hash } from 'bcrypt';
import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { AuthModule } from '@/auth/auth.module';
import { ChaptersModule } from '@/chapters/chapters.module';
import { CoursesModule } from '@/courses/courses.module';
import { GroupsModule } from '@/groups/groups.module';
import { LocalesModule } from '@/locales/locales.module';
import { UsersModule } from '@/users/users.module';
import { CompletedChaptersModule } from '@/completed-chapters/completed-chapters.module';
import { CompletedChaptersSeeder } from '@/completed-chapters/completed-chapters.seeder';
import { Course } from '@/courses/entities/course.entity';
import { Group } from '@/groups/entities/group.entity';
import { User } from '@/users/entities/user.entity';
import { Chapter } from '@/chapters/entities/chapter.entity';
import { SeedFactory } from '@/seeder/seed.factory';
import { ChaptersSeeder } from '@/chapters/chapters.seeder';
import { SegmentsSeeder } from '@/segments/segments.seeder';
import {
  createTestServer,
  obtainAdminAuthToken,
  obtainAuthToken,
} from './utils';

const TEST_USER_PASSWORD = 'password';

describe('CompletedChaptersController (e2e)', () => {
  let app: INestApplication<App>;

  let adminToken: string;
  let userToken: string;

  let user: User;
  let course: Course;
  let otherCourse: Course;
  let chapter: Chapter;

  beforeAll(async () => {
    app = await createTestServer(
      [
        AuthModule,
        LocalesModule,
        CoursesModule,
        ChaptersModule,
        GroupsModule,
        UsersModule,
        CompletedChaptersModule,
      ],
      undefined,
      [SeedFactory, ChaptersSeeder, SegmentsSeeder, CompletedChaptersSeeder],
    );

    const factory = app.get(SeedFactory);

    const [userGroup, otherGroup] = await factory.createMany(Group, 2);

    user = await factory.create(User, {
      password: await hash(TEST_USER_PASSWORD, 10),
      groups: [userGroup],
    });

    course = await factory.create(Course, { groups: [userGroup] });
    otherCourse = await factory.create(Course, { groups: [otherGroup] });

    [chapter] = await app.get(ChaptersSeeder).seed(course, 1);

    adminToken = await obtainAdminAuthToken(app);
    userToken = await obtainAuthToken(app, user.email, TEST_USER_PASSWORD);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /courses/:courseId/completed-chapters', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/courses/${course.id}/completed-chapters`)
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .get(`/courses/00000000-0000-0000-0000-000000000000/completed-chapters`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when employee does not belong to a group linked to the course', () => {
      return request(app.getHttpServer())
        .get(`/courses/${otherCourse.id}/completed-chapters`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns 200 with an empty list when user has no completed chapters in the course', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${course.id}/completed-chapters`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });

    it('returns 200 with completed chapters for the user', async () => {
      const [freshChapter] = await app.get(ChaptersSeeder).seed(course, 1);
      await app.get(CompletedChaptersSeeder).seed(freshChapter, 2);

      const res = await request(app.getHttpServer())
        .get(`/courses/${course.id}/completed-chapters`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        chapterId: freshChapter.id,
        userId: user.id,
        createdAt: expect.any(String),
      });
    });

    it('does not include completed chapters from other courses', async () => {
      const [otherChapter] = await app.get(ChaptersSeeder).seed(otherCourse, 1);
      await app.get(CompletedChaptersSeeder).seed(otherChapter, 2);

      const res = await request(app.getHttpServer())
        .get(`/courses/${course.id}/completed-chapters`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).not.toContainEqual(
        expect.objectContaining({ chapterId: otherChapter.id }),
      );
    });

    it('returns completed chapters from all users when requester is an admin', async () => {
      const freshCourse = await app.get(SeedFactory).create(Course);
      const [freshChapter] = await app.get(ChaptersSeeder).seed(freshCourse, 1);
      await app.get(CompletedChaptersSeeder).seed(freshChapter, 2);

      const res = await request(app.getHttpServer())
        .get(`/courses/${freshCourse.id}/completed-chapters`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body).toContainEqual(
        expect.objectContaining({ chapterId: freshChapter.id }),
      );
    });
  });

  describe('POST /courses/:courseId/completed-chapters', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/completed-chapters`)
        .send({ chapterId: chapter.id })
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .post(
          `/courses/00000000-0000-0000-0000-000000000000/completed-chapters`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ chapterId: chapter.id })
        .expect(404);
    });

    it('returns 400 when chapterId does not exist in the database', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/completed-chapters`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ chapterId: '00000000-0000-0000-0000-000000000000' })
        .expect(400);
    });

    it('returns 400 when chapter does not belong to the course', async () => {
      const [otherChapter] = await app.get(ChaptersSeeder).seed(otherCourse, 1);

      return request(app.getHttpServer())
        .post(`/courses/${course.id}/completed-chapters`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ chapterId: otherChapter.id })
        .expect(400);
    });

    it('returns 403 when employee does not belong to a group linked to the course', () => {
      return request(app.getHttpServer())
        .post(`/courses/${otherCourse.id}/completed-chapters`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ chapterId: chapter.id })
        .expect(403);
    });

    it('returns 409 when the chapter has already been completed by the user', async () => {
      const [freshChapter] = await app.get(ChaptersSeeder).seed(course, 1);

      await request(app.getHttpServer())
        .post(`/courses/${course.id}/completed-chapters`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ chapterId: freshChapter.id })
        .expect(201);

      return request(app.getHttpServer())
        .post(`/courses/${course.id}/completed-chapters`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ chapterId: freshChapter.id })
        .expect(409);
    });

    it('returns 201 with the completed chapter entry', async () => {
      const [freshChapter] = await app.get(ChaptersSeeder).seed(course, 1);

      const res = await request(app.getHttpServer())
        .post(`/courses/${course.id}/completed-chapters`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ chapterId: freshChapter.id })
        .expect(201);

      expect(res.body).toMatchObject({
        chapterId: freshChapter.id,
        createdAt: expect.any(String),
      });
    });

    it('allows different users to complete the same chapter', async () => {
      const [freshChapter] = await app.get(ChaptersSeeder).seed(course, 1);

      await request(app.getHttpServer())
        .post(`/courses/${course.id}/completed-chapters`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ chapterId: freshChapter.id })
        .expect(201);

      return request(app.getHttpServer())
        .post(`/courses/${course.id}/completed-chapters`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ chapterId: freshChapter.id })
        .expect(201);
    });
  });
});
