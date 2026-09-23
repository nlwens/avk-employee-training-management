import request from 'supertest';
import { hash } from 'bcrypt';
import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { DashboardModule } from '@/dashboard/dashboard.module';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { User } from '@/users/entities/user.entity';
import { Group } from '@/groups/entities/group.entity';
import { Course } from '@/courses/entities/course.entity';
import { SeedFactory } from '@/seeder/seed.factory';
import {
  createTestServer,
  obtainAdminAuthToken,
  obtainAuthToken,
} from './utils';

const TEST_USER_PASSWORD = 'password';

describe('DashboardController (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    app = await createTestServer(
      [DashboardModule, AuthModule, UsersModule],
      undefined,
      [SeedFactory],
    );

    const factory = app.get(SeedFactory);
    const hashedPassword = await hash(TEST_USER_PASSWORD, 10);

    const loginUser = await factory.create(User, {
      email: 'dashboard-user@example.com',
      password: hashedPassword,
      admin: false,
    });

    await factory.createMany(User, 2, {
      password: hashedPassword,
      admin: false,
    });

    await factory.create(User, {
      password: hashedPassword,
      admin: true,
    });

    await factory.createMany(Group, 4);

    await factory.createMany(Course, 2, {
      published: true,
    });

    await factory.create(Course, {
      published: false,
    });

    adminToken = await obtainAdminAuthToken(app);
    userToken = await obtainAuthToken(app, loginUser.email, TEST_USER_PASSWORD);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /dashboard/stats', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer()).get('/dashboard/stats').expect(401);
    });

    it('returns 403 when the user is not an administrator', () => {
      return request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns dashboard statistics for an administrator', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(body).toEqual({
        totalEmployees: 5,
        publishedCourses: 2,
        groups: 4,
      });
    });
  });
});
