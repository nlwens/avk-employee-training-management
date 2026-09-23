import request from 'supertest';
import { hash } from 'bcrypt';
import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { AuthModule } from '@/auth/auth.module';
import { CoursesModule } from '@/courses/courses.module';
import { LocalesModule } from '@/locales/locales.module';
import { GroupsModule } from '@/groups/groups.module';
import { AnswersModule } from '@/answers/answers.module';
import { QuestionsModule } from '@/questions/questions.module';
import { SeedFactory } from '@/seeder/seed.factory';
import { Group } from '@/groups/entities/group.entity';
import { User } from '@/users/entities/user.entity';
import { CourseDto } from '@/courses/dto/course.dto';
import { Course } from '@/courses/entities/course.entity';
import { CourseTranslation } from '@/courses/entities/course-translation.entity';
import { Chapter } from '@/chapters/entities/chapter.entity';
import { ChapterTranslation } from '@/chapters/entities/chapter-translation.entity';
import { Segment } from '@/segments/entities/segment.entity';
import { SegmentTranslation } from '@/segments/entities/segment-translation.entity';
import { Question } from '@/questions/entities/question.entity';
import { QuestionTranslation } from '@/questions/entities/question-translation.entity';
import { Answer } from '@/answers/entities/answer.entity';
import { AnswerTranslation } from '@/answers/entities/answer-translation.entity';
import { CompletedChapter } from '@/completed-chapters/entities/completed-chapter.entity';
import { UserAnswer } from '@/answers/entities/user-answer.entity';
import { CoursesSeeder } from '@/courses/courses.seeder';
import { ChaptersSeeder } from '@/chapters/chapters.seeder';
import { QuestionsSeeder } from '@/questions/questions.seeder';
import { SegmentsSeeder } from '@/segments/segments.seeder';
import { CompletedChaptersSeeder } from '@/completed-chapters/completed-chapters.seeder';
import { UserAnswersSeeder } from '@/answers/user-answers.seeder';
import {
  DataSource,
  EntityTarget,
  In,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import {
  createTestServer,
  obtainAdminAuthToken,
  obtainAuthToken,
} from './utils';

const VALID_TRANSLATIONS = [
  {
    locale: 'en',
    title: 'Introduction to Operations',
    content: 'Learn the basics.',
  },
];

const TEST_USER_PASSWORD = 'password';

describe('CoursesController (e2e)', () => {
  let app: INestApplication<App>;

  let adminToken: string;
  let userToken: string;
  let noGroupsUserToken: string;

  let user: User;
  let userGroup: Group;
  let otherGroup: Group;

  let userGroupCourse: Course;
  let otherGroupCourse: Course;
  let publicCourse: Course;
  let unpublishedCourseNoGroup: Course;
  let unpublishedCourseWithUserGroup: Course;

  beforeAll(async () => {
    app = await createTestServer(
      [
        AuthModule,
        LocalesModule,
        CoursesModule,
        GroupsModule,
        AnswersModule,
        QuestionsModule,
      ],
      undefined,
      [
        SeedFactory,
        ChaptersSeeder,
        QuestionsSeeder,
        SegmentsSeeder,
        CoursesSeeder,
        CompletedChaptersSeeder,
        UserAnswersSeeder,
      ],
    );

    const seeder = app.get(SeedFactory);

    // Create two different groups. The user will have only one of them.
    [userGroup, otherGroup] = await seeder.createMany(Group, 2);

    user = await seeder.create(User, {
      password: await hash(TEST_USER_PASSWORD, 10),
      groups: [userGroup],
    });

    // Create two courses with a different group. The user can see only one.
    [userGroupCourse] = await app
      .get(CoursesSeeder)
      .seed(1, [userGroup, otherGroup]);
    [otherGroupCourse] = await app.get(CoursesSeeder).seed(1, [otherGroup]);

    // A published course with no groups is public and visible to every user.
    publicCourse = await seeder.create(Course, {
      published: true,
      groups: [],
    });

    unpublishedCourseNoGroup = await seeder.create(Course, {
      published: false,
    });
    unpublishedCourseWithUserGroup = await seeder.create(Course, {
      published: false,
      groups: [userGroup],
    });

    // Mark the first chapter of the course as completed by the test user.
    // CoursesSeeder always seeds at least one chapter per course.
    await seeder.create(CompletedChapter, {
      userId: user.id,
      chapterId: userGroupCourse.chapters[0].id,
    });

    const userWithoutGroups = await seeder.create(User, {
      password: await hash(TEST_USER_PASSWORD, 10),
      groups: [],
    });

    adminToken = await obtainAdminAuthToken(app);
    userToken = await obtainAuthToken(app, user.email, TEST_USER_PASSWORD);
    noGroupsUserToken = await obtainAuthToken(
      app,
      userWithoutGroups.email,
      TEST_USER_PASSWORD,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /courses', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer()).get('/courses').expect(401);
    });

    it('returns all courses for admin', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(body).toMatchObject({
        data: expect.any(Array),
        limit: 20,
        total: 5,
        page: 1,
        pages: 1,
      });

      expect(body.data).toHaveLength(5);
      expect(body.data[0]).toMatchObject({
        id: expect.any(String),
        priority: expect.any(Number),
        translations: expect.any(Array),
      });

      const ids = body.data.map((course: CourseDto) => course.id);
      expect(ids).toContain(userGroupCourse.id);
      expect(ids).toContain(otherGroupCourse.id);
    });

    it('orders courses by priority', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/courses?limit=100')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const courses: CourseDto[] = body.data;

      // Courses come back ordered by priority, highest first.
      for (let index = 1; index < courses.length; index++) {
        expect(courses[index - 1].priority).toBeGreaterThanOrEqual(
          courses[index].priority,
        );
      }
    });

    it('returns group-assigned and public courses for users with groups', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(body.data).toHaveLength(2);

      const ids = body.data.map((course: CourseDto) => course.id);
      expect(ids).toContain(userGroupCourse.id);
      expect(ids).toContain(publicCourse.id);
      expect(ids).not.toContain(otherGroupCourse.id);
    });

    it('returns public courses for users without groups', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${noGroupsUserToken}`)
        .expect(200);

      const ids = body.data.map((course: CourseDto) => course.id);
      expect(ids).toContain(publicCourse.id);
      expect(ids).not.toContain(otherGroupCourse.id);
      expect(ids).not.toContain(userGroupCourse.id);
    });

    it('admin can see unpublished courses', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ids = body.data.map((course: CourseDto) => course.id);
      expect(ids).toContain(unpublishedCourseNoGroup.id);
    });

    it('non-admin user does not see unpublished courses', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const ids = body.data.map((course: CourseDto) => course.id);
      expect(ids).not.toContain(unpublishedCourseWithUserGroup.id);
    });

    it('includes chapter and completed chapter counts', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const course = body.data.find(
        (course: CourseDto) => course.id === userGroupCourse.id,
      );

      expect(course).toBeDefined();
      expect(course.chaptersCount).toBe(userGroupCourse.chapters.length);
      // One chapter was marked complete in beforeAll.
      expect(course.completedChaptersCount).toBe(1);
    });

    it('returns no completed chapters for a user with no completions', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const course = body.data.find(
        (course: CourseDto) => course.id === userGroupCourse.id,
      );

      expect(course).toBeDefined();
      expect(course.completedChaptersCount).toBe(0);
    });

    it('returns no chapters for a course with no chapters', async () => {
      const emptyCourse = await app.get(SeedFactory).create(Course);

      const { body } = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const course = body.data.find((c: CourseDto) => c.id === emptyCourse.id);

      expect(course).toBeDefined();
      expect(course.chaptersCount).toBe(0);
      expect(course.completedChaptersCount).toBe(0);
    });

    it('filters courses by translated title across all locales', async () => {
      const seeder = app.get(SeedFactory);

      const searchableCourse = await seeder.create(Course, {
        published: true,
        groups: [userGroup],
      });

      await seeder.create(CourseTranslation, {
        courseId: searchableCourse.id,
        localeCode: 'nl',
        title: 'Veilig werken met machines',
        content: 'Niet relevant voor deze zoekopdracht.',
      });

      const { body } = await request(app.getHttpServer())
        .get('/courses?search=machines')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const ids = body.data.map((course: CourseDto) => course.id);

      expect(ids).toContain(searchableCourse.id);
      expect(ids).not.toContain(otherGroupCourse.id);
    });

    it('filters courses by translated description/content across all locales', async () => {
      const seeder = app.get(SeedFactory);

      const searchableCourse = await seeder.create(Course, {
        published: true,
        groups: [userGroup],
      });

      await seeder.create(CourseTranslation, {
        courseId: searchableCourse.id,
        localeCode: 'en',
        title: 'Generic title',
        content: 'This course explains forklift safety rules.',
      });

      const { body } = await request(app.getHttpServer())
        .get('/courses?search=forklift')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const ids = body.data.map((course: CourseDto) => course.id);

      expect(ids).toContain(searchableCourse.id);
      expect(ids).not.toContain(otherGroupCourse.id);
    });

    it('does not let non-admin search inaccessible courses', async () => {
      const seeder = app.get(SeedFactory);

      const inaccessibleCourse = await seeder.create(Course, {
        published: true,
        groups: [otherGroup],
      });

      await seeder.create(CourseTranslation, {
        courseId: inaccessibleCourse.id,
        localeCode: 'en',
        title: 'Secret searchable course',
        content: 'This should not be visible.',
      });

      const { body } = await request(app.getHttpServer())
        .get('/courses?search=secret')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const ids = body.data.map((course: CourseDto) => course.id);

      expect(ids).not.toContain(inaccessibleCourse.id);
    });

    it('allows admin to search unpublished courses', async () => {
      const seeder = app.get(SeedFactory);

      const searchableUnpublishedCourse = await seeder.create(Course, {
        published: false,
      });

      await seeder.create(CourseTranslation, {
        courseId: searchableUnpublishedCourse.id,
        localeCode: 'en',
        title: 'Unpublished searchable course',
        content: 'Only admins should see this.',
      });

      const { body } = await request(app.getHttpServer())
        .get('/courses?search=unpublished searchable')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ids = body.data.map((course: CourseDto) => course.id);

      expect(ids).toContain(searchableUnpublishedCourse.id);
    });

    it('respects the limit parameter for pagination', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/courses?limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(body.data.length).toBe(2);
      expect(body.limit).toBe(2);
      expect(body.pages).toBe(Math.ceil(body.total / 2));
    });

    it('returns different items on successive pages', async () => {
      const { body: page1 } = await request(app.getHttpServer())
        .get('/courses?limit=2&page=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const { body: page2 } = await request(app.getHttpServer())
        .get('/courses?limit=2&page=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(page1.total).toBe(page2.total);

      const page1Ids = page1.data.map((course: CourseDto) => course.id);
      const page2Ids = page2.data.map((course: CourseDto) => course.id);

      expect(page1Ids.length).toBeGreaterThan(0);
      expect(page2Ids.length).toBeGreaterThan(0);

      page2Ids.forEach((id: string) => expect(page1Ids).not.toContain(id));
    });

    it('returns an empty data array when page exceeds total pages', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/courses?page=999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(body.data).toHaveLength(0);
      expect(body.total).toBeGreaterThan(0);
    });
  });

  describe('GET /courses?finished', () => {
    // The top-level setup leaves userGroupCourse in progress for the user, as
    // it does not have all chapters marked completed and all questions
    // answered. We only need to add one fully completed course to cover the
    // finished=true case.
    let finishedCourse: Course;

    const fetchCourses = async (finished?: boolean): Promise<string[]> => {
      const filter = finished === undefined ? '' : `finished=${finished}`;

      const { body } = await request(app.getHttpServer())
        .get(`/courses?${filter}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      return (body.data as CourseDto[]).map((course) => course.id);
    };

    beforeAll(async () => {
      [finishedCourse] = await app.get(CoursesSeeder).seed(1, [userGroup]);

      // Complete every chapter and answer every question for the user, so the
      // course counts as fully finished.
      for (const chapter of finishedCourse.chapters) {
        await app.get(CompletedChaptersSeeder).seed(chapter, 3);
      }

      for (const question of finishedCourse.questions) {
        await app.get(UserAnswersSeeder).seed(question, 3, true);
      }
    });

    it('returns started-but-unfinished courses when finished=false', async () => {
      const ids = await fetchCourses(false);

      expect(ids).toContain(userGroupCourse.id);
      expect(ids).not.toContain(finishedCourse.id);
    });

    it('returns fully completed courses when finished=true', async () => {
      const ids = await fetchCourses(true);

      expect(ids).toContain(finishedCourse.id);
      expect(ids).not.toContain(userGroupCourse.id);
    });

    it('returns courses of any progress when the filter is omitted', async () => {
      const ids = await fetchCourses();

      expect(ids).toContain(userGroupCourse.id);
      expect(ids).toContain(finishedCourse.id);
    });
  });

  describe('GET /courses/:id', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/courses/${userGroupCourse.id}`)
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .get('/courses/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when user does not have access to the course', () => {
      return request(app.getHttpServer())
        .get(`/courses/${otherGroupCourse.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('allows users without groups to access public courses', async () => {
      await request(app.getHttpServer())
        .get(`/courses/${publicCourse.id}`)
        .set('Authorization', `Bearer ${noGroupsUserToken}`)
        .expect(200);
    });

    it('returns 403 when user without groups tries to access a restricted course', async () => {
      await request(app.getHttpServer())
        .get(`/courses/${otherGroupCourse.id}`)
        .set('Authorization', `Bearer ${noGroupsUserToken}`)
        .expect(403);
    });

    it('returns 200 with course details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${otherGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: otherGroupCourse.id,
        published: expect.any(Boolean),
        priority: expect.any(Number),
        translations: expect.any(Array),
        groups: expect.any(Array),
      });

      expect(res.body.groups).toHaveLength(1);
      expect(res.body.groups[0]).toHaveProperty('id', otherGroup.id);
    });

    it('returns 403 when non-admin tries to access unpublished course', async () => {
      return request(app.getHttpServer())
        .get(`/courses/${unpublishedCourseWithUserGroup.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('admin can access unpublished course', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${unpublishedCourseNoGroup.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(unpublishedCourseNoGroup.id);
      expect(res.body.published).toBe(false);
    });

    it('includes chapter and completed chapter count', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // One chapter was marked complete in beforeAll.
      expect(res.body.completedChaptersCount).toBe(1);
      expect(res.body.chaptersCount).toBe(userGroupCourse.chapters.length);
    });

    it('returns no completed chapters for a user with no completions', async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.completedChaptersCount).toBe(0);
    });

    it('returns no chapters for a course with no chapters', async () => {
      const emptyCourse = await app.get(SeedFactory).create(Course);

      const res = await request(app.getHttpServer())
        .get(`/courses/${emptyCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.chaptersCount).toBe(0);
      expect(res.body.completedChaptersCount).toBe(0);
    });
  });

  describe('POST /courses', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .post('/courses')
        .send({ translations: VALID_TRANSLATIONS })
        .expect(401);
    });

    it('returns 400 when translations are missing', () => {
      return request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });

    it('returns 400 when translations array is empty', () => {
      return request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: [] })
        .expect(400);
    });

    it('returns 400 when a translation locale is not supported', () => {
      return request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: [{ locale: 'xx', title: 'Test', content: 'Content' }],
        })
        .expect(400);
    });

    it('returns 400 when a translation title is missing', () => {
      return request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: [{ locale: 'en', content: 'Content' }],
        })
        .expect(400);
    });

    it('returns 400 when translations contain duplicate locales', () => {
      return request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: [
            { locale: 'en', title: 'First', content: 'Content 1' },
            { locale: 'en', title: 'Duplicate', content: 'Content 2' },
          ],
        })
        .expect(400);
    });

    it('returns 400 when a referenced group does not exist', () => {
      return request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: VALID_TRANSLATIONS,
          groups: ['00000000-0000-0000-0000-000000000000'],
        })
        .expect(400);
    });

    it('creates a course without groups', async () => {
      const res = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: VALID_TRANSLATIONS })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.priority).toBe(0);
      expect(res.body.translations).toHaveLength(1);
      expect(res.body.translations[0].title).toBe(VALID_TRANSLATIONS[0].title);
      expect(res.body.groups).toEqual([]);
    });

    it('lets an admin set the priority on creation', async () => {
      const res = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ translations: VALID_TRANSLATIONS, priority: 67 })
        .expect(201);

      expect(res.body.priority).toBe(67);
    });

    it('creates a course and associates it with existing groups', async () => {
      const groupRes = await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `E2E Group ${Date.now()}` })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: VALID_TRANSLATIONS,
          groups: [groupRes.body.id],
        })
        .expect(201);

      expect(res.body.groups).toHaveLength(1);
      expect(res.body.groups[0].id).toBe(groupRes.body.id);
    });

    it('creates a course with multiple translations', async () => {
      const res = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: [
            ...VALID_TRANSLATIONS,
            { locale: 'nl', title: 'Dutch title', content: 'Dutch content' },
          ],
        })
        .expect(201);

      expect(res.body.translations).toHaveLength(2);
    });
  });

  describe('PATCH /courses/:courseId', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .patch('/courses/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when non-admin attempts to delete a course', () => {
      return request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns 400 when a translation locale is not supported', () => {
      return request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: [{ locale: 'xx', title: 'Test', content: 'Content' }],
        })
        .expect(400);
    });

    it('returns 400 when translations contain duplicate locales', () => {
      return request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: [
            { locale: 'en', title: 'First', content: 'Content 1' },
            { locale: 'en', title: 'Duplicate', content: 'Content 2' },
          ],
        })
        .expect(400);
    });

    it('returns 400 when a referenced group does not exist', () => {
      return request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: VALID_TRANSLATIONS,
          groups: ['00000000-0000-0000-0000-000000000000'],
        })
        .expect(400);
    });

    it('returns 200 even when body attributes are missing (no updates)', () => {
      return request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(200);
    });

    it('updates an existing course', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          groups: [userGroup.id],
          translations: [
            {
              locale: 'en',
              title: 'Updated title',
              content: 'Updated content',
            },
            {
              locale: 'nl',
              title: 'Updated title in dutch',
              content: 'Updated content in dutch',
            },
          ],
        })
        .expect(200);

      expect(res.body.translations[0].title).toBe('Updated title');
      expect(res.body.translations[0].content).toBe('Updated content');
      expect(res.body.translations[1].title).toBe('Updated title in dutch');
      expect(res.body.translations[1].content).toBe('Updated content in dutch');
    });

    it('creates during the update a new translation if it does not exist', async () => {
      await request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: [
            {
              locale: 'en',
              title: 'English title',
              content: 'English content',
            },
          ],
        })
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          groups: [userGroup.id],
          translations: [
            {
              locale: 'nl',
              title: 'Dutch title',
              content: 'Dutch content',
            },
          ],
        })
        .expect(200);

      expect(res.body.translations).toHaveLength(2);
      expect(res.body.translations[0].title).toBe('English title');
      expect(res.body.translations[1].title).toBe('Dutch title');
    });

    it('updates only groups without affecting existing translations', async () => {
      await request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: [
            { locale: 'nl', title: 'Original NL', content: 'Content NL' },
            { locale: 'en', title: 'Original EN', content: 'Content EN' },
          ],
        })
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          groups: [otherGroup.id],
        })
        .expect(200);

      expect(res.body.translations[0].title).toBe('Original NL');
      expect(res.body.translations[1].title).toBe('Original EN');
    });

    it('removes all group associations when groups is empty array', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          groups: [],
        })
        .expect(200);

      expect(res.body.groups).toHaveLength(0);
    });

    it('reassigns course to different groups', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          groups: [otherGroup.id],
        })
        .expect(200);

      expect(res.body.groups).toHaveLength(1);
      expect(res.body.groups[0].id).toBe(otherGroup.id);
    });

    it('allows assigning to multiple groups', async () => {
      const thirdGroup = await app.get(SeedFactory).create(Group);

      const res = await request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          groups: [userGroup.id, otherGroup.id, thirdGroup.id],
          translations: [
            { locale: 'en', title: 'Multi-group course', content: 'Content' },
          ],
        })
        .expect(200);

      expect(res.body.groups).toHaveLength(3);
      expect(res.body.groups.map((g: Group) => g.id)).toContain(userGroup.id);
      expect(res.body.groups.map((g: Group) => g.id)).toContain(otherGroup.id);
      expect(res.body.groups.map((g: Group) => g.id)).toContain(thirdGroup.id);
    });

    it('updates the published field to true', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ published: true })
        .expect(200);

      expect(res.body.published).toBe(true);
    });

    it('updates the published field to false', async () => {
      const seeder = app.get(SeedFactory);
      const publishedCourse = await seeder.create(Course, {
        published: true,
      });

      const res = await request(app.getHttpServer())
        .patch(`/courses/${publishedCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ published: false })
        .expect(200);

      expect(res.body.published).toBe(false);
    });

    it('returns 400 when published field is not a boolean', () => {
      return request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ published: 'true' })
        .expect(400);
    });

    it('allows omitting the published field in update', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translations: [
            { locale: 'en', title: 'Updated', content: 'Content' },
          ],
        })
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('updates the priority field', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ priority: 7 })
        .expect(200);

      expect(res.body.priority).toBe(7);
    });

    it('leaves the priority unchanged when it is omitted', async () => {
      const seeder = app.get(SeedFactory);
      const course = await seeder.create(Course, { priority: 5 });

      const res = await request(app.getHttpServer())
        .patch(`/courses/${course.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ published: true })
        .expect(200);

      expect(res.body.priority).toBe(5);
    });
  });

  describe('DELETE /courses/:courseId', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .delete(`/courses/${userGroupCourse.id}`)
        .expect(401);
    });

    it('returns 404 when course does not exist', () => {
      return request(app.getHttpServer())
        .delete('/courses/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when non-admin attempts to delete a course', () => {
      return request(app.getHttpServer())
        .delete(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('deletes a course and all related data', async () => {
      const dataSource = app.get(DataSource);
      const getRepo = <T extends ObjectLiteral>(
        entity: EntityTarget<T>,
      ): Repository<T> => dataSource.getRepository(entity);
      const getCourseGroups = () =>
        dataSource
          .createQueryBuilder()
          .select('cg.course_id', 'courseId')
          .addSelect('cg.group_id', 'groupId')
          .from('courses_groups', 'cg')
          .where('cg.course_id = :courseId', { courseId: userGroupCourse.id })
          .getRawMany();

      const courseRepo = getRepo(Course);
      const courseTranslationRepo = getRepo(CourseTranslation);
      const chapterRepo = getRepo(Chapter);
      const chapterTranslationRepo = getRepo(ChapterTranslation);
      const segmentRepo = getRepo(Segment);
      const segmentTranslationRepo = getRepo(SegmentTranslation);
      const questionRepo = getRepo(Question);
      const answerRepo = getRepo(Answer);
      const questionTranslationRepo = getRepo(QuestionTranslation);
      const answerTranslationRepo = getRepo(AnswerTranslation);
      const completedChapterRepo = getRepo(CompletedChapter);
      const userAnswerRepo = getRepo(UserAnswer);

      const [
        courseBefore,
        courseTranslationsBefore,
        chaptersBefore,
        questionsBefore,
        courseGroupsBefore,
      ] = await Promise.all([
        courseRepo.findOne({ where: { id: userGroupCourse.id } }),
        courseTranslationRepo.find({ where: { courseId: userGroupCourse.id } }),
        chapterRepo.find({ where: { courseId: userGroupCourse.id } }),
        questionRepo.find({ where: { courseId: userGroupCourse.id } }),
        getCourseGroups(),
      ]);

      const chapterIds = chaptersBefore.map((chapter: Chapter) => chapter.id);

      const chapterTranslationsBefore = await chapterTranslationRepo.find({
        where: { chapterId: In(chapterIds) },
      });

      expect(courseBefore).not.toBeNull();
      expect(courseTranslationsBefore.length).toBeGreaterThan(0);
      expect(chaptersBefore.length).toBeGreaterThan(0);
      expect(chapterTranslationsBefore.length).toBeGreaterThan(0);
      expect(questionsBefore.length).toBeGreaterThan(0);
      expect(courseGroupsBefore.length).toBeGreaterThan(0);

      const questionIds = questionsBefore.map(
        (question: Question) => question.id,
      );

      const [segmentRows, answerRows] = await Promise.all([
        segmentRepo.find({ where: { chapterId: In(chapterIds) } }),
        answerRepo.find({ where: { questionId: In(questionIds) } }),
      ]);

      expect(segmentRows.length).toBeGreaterThan(0);
      expect(answerRows.length).toBeGreaterThan(0);

      const segmentIds = segmentRows.map((segment: Segment) => segment.id);
      const answerIds = answerRows.map((answer: Answer) => answer.id);

      await request(app.getHttpServer())
        .delete(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .delete(`/courses/${userGroupCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      const [
        courseAfter,
        courseTranslationsAfter,
        chaptersAfter,
        chapterTranslationsAfter,
        questionsAfter,
        segmentTranslationsAfter,
        questionTranslationsAfter,
        answerTranslationsAfter,
        completedChaptersAfter,
        userAnswersAfter,
        courseGroupsAfter,
      ] = await Promise.all([
        courseRepo.findOne({ where: { id: userGroupCourse.id } }),
        courseTranslationRepo.find({ where: { courseId: userGroupCourse.id } }),
        chapterRepo.find({ where: { courseId: userGroupCourse.id } }),
        chapterTranslationRepo.find({
          where: { chapterId: In(chapterIds) },
        }),
        questionRepo.find({ where: { courseId: userGroupCourse.id } }),
        segmentTranslationRepo.find({ where: { segmentId: In(segmentIds) } }),
        questionTranslationRepo.find({
          where: { questionId: In(questionIds) },
        }),
        answerTranslationRepo.find({ where: { answerId: In(answerIds) } }),
        completedChapterRepo.find({ where: { chapterId: In(chapterIds) } }),
        userAnswerRepo.find({ where: { questionId: In(questionIds) } }),
        getCourseGroups(),
      ]);

      expect(courseAfter).toBeNull();
      expect(courseTranslationsAfter).toHaveLength(0);
      expect(chaptersAfter).toHaveLength(0);
      expect(chapterTranslationsAfter).toHaveLength(0);
      expect(questionsAfter).toHaveLength(0);
      expect(segmentTranslationsAfter).toHaveLength(0);
      expect(questionTranslationsAfter).toHaveLength(0);
      expect(answerTranslationsAfter).toHaveLength(0);
      expect(completedChaptersAfter).toHaveLength(0);
      expect(userAnswersAfter).toHaveLength(0);
      expect(courseGroupsAfter).toHaveLength(0);
    });
  });

  describe('GET /courses/:id/stats', () => {
    const submitAnswersForUser = (
      userId: string,
      questions: Question[],
      correctAnswers: number,
      answeredQuestions = questions.length,
    ) =>
      Promise.all(
        questions.slice(0, answeredQuestions).map((question, index) => {
          const { correctAnswerId, answers } = question;

          const answerId =
            index < correctAnswers
              ? correctAnswerId
              : answers.find((answer) => answer.id !== correctAnswerId)?.id;

          expect(answerId).toBeDefined();

          return app.get(SeedFactory).create(UserAnswer, {
            userId,
            questionId: question.id,
            answerId: answerId as string,
          });
        }),
      );

    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/courses/${userGroupCourse.id}/stats`)
        .expect(401);
    });

    it('returns 403 when a non-admin tries to access course stats', () => {
      return request(app.getHttpServer())
        .get(`/courses/${userGroupCourse.id}/stats`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns question count and average score for users who answered all questions', async () => {
      const seeder = app.get(SeedFactory);

      const course = await seeder.create(Course);
      const questions = await app.get(QuestionsSeeder).seed(course, 5);

      const [lowScoreUser, highScoreUser, partialUser] =
        await seeder.createMany(User, 3);

      await submitAnswersForUser(lowScoreUser.id, questions, 1);
      await submitAnswersForUser(highScoreUser.id, questions, 3);

      // This user answered only 2 out of 5 questions, so they must not affect the average.
      await submitAnswersForUser(partialUser.id, questions, 2, 2);

      const res = await request(app.getHttpServer())
        .get(`/courses/${course.id}/stats`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual({
        averageScore: 40,
      });
    });
  });

  describe('GET /courses/:id/quiz-results', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/courses/${otherGroupCourse.id}/quiz-results`)
        .expect(401);
    });

    it('returns 403 when a non-admin requests quiz results', () => {
      return request(app.getHttpServer())
        .get(`/courses/${otherGroupCourse.id}/quiz-results`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns a scored row for each user who answered every question', async () => {
      for (const question of otherGroupCourse.questions) {
        await app
          .get(UserAnswersSeeder)
          .seed(question, Number.MAX_SAFE_INTEGER);
      }

      const { body } = await request(app.getHttpServer())
        .get(`/courses/${otherGroupCourse.id}/quiz-results`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(body.length).toBeGreaterThan(0);

      for (const row of body) {
        expect(row).toMatchObject({
          userId: expect.any(String),
          score: expect.any(Number),
          submittedAt: expect.any(String),
        });
        expect(row.score).toBeGreaterThanOrEqual(0);
        expect(row.score).toBeLessThanOrEqual(
          otherGroupCourse.questions.length,
        );
      }
    });
  });
});
