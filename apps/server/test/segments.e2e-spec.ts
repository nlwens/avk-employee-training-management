import request from 'supertest';
import { hash } from 'bcrypt';
import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { AuthModule } from '@/auth/auth.module';
import { ChaptersModule } from '@/chapters/chapters.module';
import { CoursesModule } from '@/courses/courses.module';
import { LocalesModule } from '@/locales/locales.module';
import { User } from '@/users/entities/user.entity';
import { SeedFactory } from '@/seeder/seed.factory';
import { SegmentsModule } from '@/segments/segments.module';
import { GroupsModule } from '@/groups/groups.module';
import { Group } from '@/groups/entities/group.entity';
import { Course } from '@/courses/entities/course.entity';
import { Chapter } from '@/chapters/entities/chapter.entity';
import { SegmentsSeeder } from '@/segments/segments.seeder';
import { Segment } from '@/segments/entities/segment.entity';
import { SegmentDto } from '@/segments/dto/segment.dto';
import {
  createTestServer,
  obtainAdminAuthToken,
  obtainAuthToken,
} from './utils';
import { SegmentAttachmentType } from '@/segments/segments';
import { ErrorCode } from '@/common/enums/error-codes.enum';

const TEST_USER_PASSWORD = 'password';

const VALID_TRANSLATIONS = [
  {
    locale: 'en',
    content: 'Text content',
  },
];

describe('SegmentsController (e2e)', () => {
  let app: INestApplication<App>;

  let userToken: string;
  let adminToken: string;

  let course: Course;
  let otherCourse: Course;
  let unpublishedCourseWithUserGroup: Course;

  let chapter1: Chapter;
  let chapter2: Chapter;
  let chapter3: Chapter;
  let unpublishedChapter: Chapter;
  let chapter1Segments: Segment[];
  let chapter2Segments: Segment[];
  let chapter3Segments: Segment[];

  let textSegment: Segment;
  let pdfSegment: Segment;

  beforeAll(async () => {
    app = await createTestServer(
      [
        AuthModule,
        LocalesModule,
        GroupsModule,
        CoursesModule,
        ChaptersModule,
        SegmentsModule,
      ],
      undefined,
      [SeedFactory, SegmentsSeeder],
    );

    const factory = app.get(SeedFactory);

    // Create two different groups. The user will have only one of them.
    const [userGroup, otherGroup] = await factory.createMany(Group, 2);

    const user = await factory.create(User, {
      password: await hash(TEST_USER_PASSWORD, 10),
      groups: [userGroup],
    });

    // Create two courses for different groups.
    course = await factory.create(Course, { groups: [userGroup] });
    otherCourse = await factory.create(Course, { groups: [otherGroup] });
    unpublishedCourseWithUserGroup = await factory.create(Course, {
      published: false,
      groups: [userGroup],
    });

    // Create three chapters: chapter1 and chapter 3 belong to one course, chapter 2 belongs to a separate course.
    chapter1 = await factory.create(Chapter, { course });
    chapter2 = await factory.create(Chapter, { course: otherCourse });
    chapter3 = await factory.create(Chapter, { course });
    unpublishedChapter = await factory.create(Chapter, {
      course: unpublishedCourseWithUserGroup,
    });

    // We are interested in testing segments only for the specific chapter that user is looking at.
    chapter1Segments = await app.get(SegmentsSeeder).seed(chapter1, 3);
    chapter2Segments = await app.get(SegmentsSeeder).seed(chapter2, 2);
    chapter3Segments = await app.get(SegmentsSeeder).seed(chapter3, 4);
    await app.get(SegmentsSeeder).seed(unpublishedChapter, 2);

    textSegment = await factory.create(Segment, {
      chapterId: chapter1.id,
      type: SegmentAttachmentType.TEXT,
      order: 98,
    });

    pdfSegment = await factory.create(Segment, {
      chapterId: chapter1.id,
      type: SegmentAttachmentType.PDF,
      order: 91,
    });

    userToken = await obtainAuthToken(app, user.email, TEST_USER_PASSWORD);
    adminToken = await obtainAdminAuthToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /courses/:courseId/chapters/:chapterId/segments', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .get(
          `/courses/00000000-0000-0000-0000-000000000000/chapters/${chapter1.id}/segments`,
        )
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('returns 404 when chapter of the course doe not exist', () => {
      return request(app.getHttpServer())
        .get(
          `/courses/${course.id}/chapters/00000000-0000-0000-0000-000000000000/segments`,
        )
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('returns 404 when chapter does not belong to the course', () => {
      return request(app.getHttpServer())
        .get(`/courses/${course.id}/chapters/${chapter2.id}/segments`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('returns 403 when user does not belong to a group linked to the other course', () => {
      return request(app.getHttpServer())
        .get(`/courses/${otherCourse.id}/chapters/${chapter2.id}/segments`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns segments that belong to a linked chapter', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveLength(5);
      expect(res.body[0]).toMatchObject({
        id: expect.any(String),
        type: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        chapterId: expect.any(String),
        order: expect.any(Number),
        translations: expect.any(Array),
        files: expect.any(Array),
      });

      expect(res.body[0].translations.length).toBeGreaterThan(0);
      expect(res.body[0].translations[0]).toMatchObject({
        localeCode: expect.any(String),
        content: expect.any(String),
      });
    });

    it('returns only segments for the requested chapter, not other chapters in the same course', async () => {
      const res1 = await request(app.getHttpServer())
        .get(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const res2 = await request(app.getHttpServer())
        .get(`/courses/${course.id}/chapters/${chapter3.id}/segments`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res1.body).toHaveLength(5);
      expect(res2.body).toHaveLength(4);
      expect(res1.body[0].chapterId).toBe(chapter1.id);
      expect(res2.body[0].chapterId).toBe(chapter3.id);

      const res1Ids = res1.body.map((s: SegmentDto) => s.id);
      const res2Ids = res2.body.map((s: SegmentDto) => s.id);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      expect(res1Ids.some((id: string) => res2Ids.includes(id))).toBe(false);
    });

    it('returns segments ordered by order field ascending', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const orders: number[] = res.body.map(
        (segment: SegmentDto) => segment.order,
      );
      expect(orders).toEqual(orders.toSorted());
    });

    it('returns 403 when non-admin tries to access segments of unpublished course', () => {
      return request(app.getHttpServer())
        .get(
          `/courses/${unpublishedCourseWithUserGroup.id}/chapters/${unpublishedChapter.id}/segments`,
        )
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('admin can access segments of unpublished course', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/courses/${unpublishedCourseWithUserGroup.id}/chapters/${unpublishedChapter.id}/segments`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toMatchObject({
        id: expect.any(String),
        type: expect.any(String),
        order: expect.any(Number),
        chapterId: unpublishedChapter.id,
        translations: expect.any(Array),
        files: expect.any(Array),
      });
    });
  });

  describe('POST /courses/:courseId/chapters/:chapterId/segments', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .send({
          order: 1,
          type: 'text',
          translations: VALID_TRANSLATIONS,
        })
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .post(
          `/courses/00000000-0000-0000-0000-000000000000/chapters/${chapter1.id}/segments`,
        )
        .send({
          order: 1,
          type: 'text',
          translations: VALID_TRANSLATIONS,
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when chapter of the course does not exist', () => {
      return request(app.getHttpServer())
        .post(
          `/courses/${course.id}/chapters/00000000-0000-0000-0000-000000000000/segments`,
        )
        .send({
          order: 1,
          type: 'text',
          translations: VALID_TRANSLATIONS,
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when non-admin user tries to create a segment for a chapter', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .send({
          order: 1,
          type: 'text',
          translations: VALID_TRANSLATIONS,
        })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns 400 when order is missing', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'text', translations: VALID_TRANSLATIONS })
        .expect(400);
    });

    it('returns 400 when segment type is missing', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ order: 1, translations: VALID_TRANSLATIONS })
        .expect(400);
    });

    it('returns 400 when translations array is empty', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'text', order: 1, translations: [] })
        .expect(400);
    });

    it('returns 400 when a TEXT type translation content is missing', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'text',
          order: 1,
          translations: [{ locale: 'en' }],
        })
        .expect(400);
    });

    it('returns 400 when a PDF file segment includes text content', async () => {
      const res = await request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('type', 'pdf')
        .field('order', '1')
        .field('translations[0][locale]', 'en')
        .field('translations[0][content]', 'this content should not be here')
        .attach('file_en', Buffer.from('%PDF-1.4 dummy content'), 'test.pdf')
        .expect(400);

      expect(res.body.code).toBe(ErrorCode.TRANSLATIONS_NOT_ALLOWED);
    });

    it('returns 400 when a PDF file is marked with a TEXT type', async () => {
      const res = await request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('type', 'text')
        .field('order', '1')
        .attach('file_en', Buffer.from('%PDF-1.4 dummy content'), 'test.pdf')
        .expect(400);

      expect(res.body.code).toBe(ErrorCode.INVALID_FILE_TYPE);
    });

    it('returns 400 when translations contain duplicate locales', () => {
      return request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'text',
          order: 1,
          translations: [
            { locale: 'en', title: 'First', content: 'Some content 1' },
            { locale: 'en', title: 'Second', content: 'Some content 2' },
          ],
        })
        .expect(400);
    });

    it('returns 400 when PDF file type is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('type', 'pdf')
        .field('order', '1')
        .attach('file_en', Buffer.from('This is text content'), 'invalid.txt')
        .expect(400);

      expect(res.body.code).toBe(ErrorCode.INVALID_FILE_TYPE);
    });

    it('returns 400 when VIDEO file type is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('type', 'video')
        .field('order', '1')
        .attach('file_nl', Buffer.from('%PDF-1.4 dummy'), 'invalid.pdf')
        .expect(400);

      expect(res.body.code).toBe(ErrorCode.INVALID_FILE_TYPE);
    });

    it('returns 400 when PDF file exceeds max size', async () => {
      const largeBuffer = Buffer.alloc(51 * 1024 * 1024);
      const res = await request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('type', 'pdf')
        .field('order', '1')
        .attach('file_en', largeBuffer, 'large.pdf')
        .expect(400);

      expect(res.body.code).toBe(ErrorCode.EXCEEDS_MAX_FILE_SIZE);
    });

    it('returns 400 when VIDEO file exceeds max size', async () => {
      const largeBuffer = Buffer.alloc(201 * 1024 * 1024);
      const res = await request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('type', 'video')
        .field('order', '1')
        .attach('file_en', largeBuffer, 'large.mp4')
        .expect(400);

      expect(res.body.code).toBe(ErrorCode.EXCEEDS_MAX_FILE_SIZE);
    });

    it('creates a TEXT segment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'text',
          order: 1,
          translations: VALID_TRANSLATIONS,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.order).toBe(1);
      expect(res.body.translations).toHaveLength(1);
      expect(res.body.type).toEqual(SegmentAttachmentType.TEXT);
      expect(res.body.translations[0].content).toBe(
        VALID_TRANSLATIONS[0].content,
      );
      expect(res.body.files).toStrictEqual([]);
    });

    it('creates a PDF file segment with one english file', async () => {
      const res = await request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('type', 'pdf')
        .field('order', '1')
        .attach('file_en', Buffer.from('%PDF-1.4 dummy content'), 'test.pdf')
        .expect(201);

      expect(res.body.type).toBe(SegmentAttachmentType.PDF);
      expect(res.body.files).toHaveLength(1);
      expect(res.body.files[0]).toMatchObject({
        id: expect.any(String),
        mimetype: 'application/pdf',
        localeCode: 'en',
      });

      expect(res.body.translations).toStrictEqual([]);
    });

    it('creates a segment with multiple files for each locale', async () => {
      const res = await request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('type', 'pdf')
        .field('order', '5')
        .attach('file_en', Buffer.from('%PDF-1.4 english'), 'en.pdf')
        .attach('file_nl', Buffer.from('%PDF-1.4 dutch'), 'nl.pdf')
        .expect(201);

      expect(res.body.files).toHaveLength(2);
      expect(res.body.files.some((f: any) => f.localeCode === 'en')).toBe(true);
      expect(res.body.files.some((f: any) => f.localeCode === 'nl')).toBe(true);
    });
  });

  describe('PATCH /courses/:courseId/chapters/:chapterId/segments/:segmentId', () => {
    it('returns 401 when no token is provided', async () => {
      return request(app.getHttpServer())
        .patch(
          `/courses/${course.id}/chapters/${chapter1.id}/segments/${chapter1Segments[0].id}`,
        )
        .send({ order: 1, translations: VALID_TRANSLATIONS })
        .expect(401);
    });

    it('returns 404 when course does not exist', async () => {
      return request(app.getHttpServer())
        .patch(
          `/courses/00000000-0000-0000-0000-000000000000/chapters/${chapter1.id}/segments/${chapter1Segments[0].id}`,
        )
        .send({ order: 1, translations: VALID_TRANSLATIONS })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when chapter does not exist', async () => {
      return request(app.getHttpServer())
        .patch(
          `/courses/${course.id}/chapters/00000000-0000-0000-0000-000000000000/segments/${chapter1Segments[0].id}`,
        )
        .send({ order: 1, translations: VALID_TRANSLATIONS })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when segment does not belong to the chapter', async () => {
      return request(app.getHttpServer())
        .patch(
          `/courses/${course.id}/chapters/${chapter1.id}/segments/${chapter2Segments[0].id}`,
        )
        .send({ order: 1, translations: VALID_TRANSLATIONS })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when segment does not exist', () => {
      return request(app.getHttpServer())
        .patch(
          `/courses/${course.id}/chapters/${chapter1.id}/segments/00000000-0000-0000-0000-000000000000`,
        )
        .send({ order: 1, translations: VALID_TRANSLATIONS })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when non-admin attempts to update a chapter segment', async () => {
      return request(app.getHttpServer())
        .patch(
          `/courses/${course.id}/chapters/${chapter1.id}/segments/${chapter1Segments[0].id}`,
        )
        .send({ order: 1, translations: VALID_TRANSLATIONS })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns 400 when translations contain duplicate locales', () => {
      return request(app.getHttpServer())
        .patch(
          `/courses/${course.id}/chapters/${chapter1.id}/segments/${chapter1Segments[0].id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'text',
          order: 1,
          translations: [
            { locale: 'en', title: 'First', content: 'Some content 1' },
            { locale: 'en', title: 'Second', content: 'Some content 2' },
          ],
        })
        .expect(400);
    });

    it('returns 200 when translations array is empty', () => {
      return request(app.getHttpServer())
        .patch(
          `/courses/${course.id}/chapters/${chapter1.id}/segments/${chapter1Segments[0].id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'text', order: 1, translations: [] })
        .expect(200);
    });

    it('returns 200 when a type is sent but does not change the segment type', async () => {
      const res1 = await request(app.getHttpServer())
        .post(`/courses/${course.id}/chapters/${chapter1.id}/segments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'text',
          order: 1,
          translations: VALID_TRANSLATIONS,
        })
        .expect(201);

      const res2 = await request(app.getHttpServer())
        .patch(
          `/courses/${course.id}/chapters/${chapter1.id}/segments/${res1.body.id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'text',
          order: 1,
          translations: VALID_TRANSLATIONS,
        })
        .expect(200);

      expect(res2.body.type).toEqual(res1.body.type);
    });

    it('returns 200 even when body attributes are missing (no updates)', () => {
      return request(app.getHttpServer())
        .patch(
          `/courses/${course.id}/chapters/${chapter1.id}/segments/${chapter1Segments[0].id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(200);
    });

    it('updates a TEXT segment associated to the existing chapter', async () => {
      const res = await request(app.getHttpServer())
        .patch(
          `/courses/${course.id}/chapters/${chapter1.id}/segments/${textSegment.id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'text',
          order: 1,
          translations: VALID_TRANSLATIONS,
        })
        .expect(200);

      expect(res.body.translations[0].content).toBe(
        VALID_TRANSLATIONS[0].content,
      );
    });

    it('updates a PDF segment associated to the existing chapter', async () => {
      const res = await request(app.getHttpServer())
        .patch(
          `/courses/${course.id}/chapters/${chapter1.id}/segments/${pdfSegment.id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .field('type', 'pdf')
        .attach('file_en', Buffer.from('%PDF-1.4 new dutch file'), 'new.pdf')
        .expect(200);

      expect(res.body.files).toHaveLength(1);
      expect(res.body.files[0]).toMatchObject({
        id: expect.any(String),
        mimetype: 'application/pdf',
        localeCode: 'en',
      });
    });
  });

  describe('DELETE /courses/:courseId/chapters/:chapterId/segments/:segmentId', () => {
    it('returns 401 when no token is provided', async () => {
      return request(app.getHttpServer())
        .delete(
          `/courses/${course.id}/chapters/${chapter1.id}/segments/${chapter1Segments[0].id}`,
        )
        .expect(401);
    });

    it('returns 404 when course does not exist', async () => {
      return request(app.getHttpServer())
        .delete(
          `/courses/00000000-0000-0000-0000-000000000000/chapters/${chapter1.id}/segments/${chapter1Segments[0].id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when chapter does not exist', async () => {
      return request(app.getHttpServer())
        .delete(
          `/courses/${course.id}/chapters/00000000-0000-0000-0000-000000000000/segments/${chapter1Segments[0].id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when segment does not belong to the chapter', async () => {
      return request(app.getHttpServer())
        .delete(
          `/courses/${course.id}/chapters/${chapter1.id}/segments/${chapter2Segments[0].id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 404 when segment does not exist', () => {
      return request(app.getHttpServer())
        .delete(
          `/courses/${course.id}/chapters/${chapter1.id}/segments/00000000-0000-0000-0000-000000000000`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when non-admin attempts to delete a chapter segment', async () => {
      return request(app.getHttpServer())
        .delete(
          `/courses/${course.id}/chapters/${chapter1.id}/segments/${chapter1Segments[0].id}`,
        )
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('deletes a chapter segment and removes related translations', async () => {
      const segmentRepo = app.get('SegmentRepository');
      const segmentTranslationRepo = app.get('SegmentTranslationRepository');
      const fileRepo = app.get('FileRepository');

      const segmentToDelete = chapter3Segments[0];

      await request(app.getHttpServer())
        .delete(
          `/courses/${course.id}/chapters/${chapter3.id}/segments/${segmentToDelete.id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .delete(
          `/courses/${course.id}/chapters/${chapter3.id}/segments/${segmentToDelete.id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      const [segment, translations, files] = await Promise.all([
        segmentRepo.findOne({
          where: { id: segmentToDelete.id },
        }),
        segmentTranslationRepo.find({
          where: { segmentId: segmentToDelete.id },
        }),
        fileRepo.find({
          where: { segmentId: segmentToDelete.id },
        }),
      ]);

      expect(segment).toBeNull();
      expect(translations).toHaveLength(0);
      expect(files).toHaveLength(0);
    });
  });
});
