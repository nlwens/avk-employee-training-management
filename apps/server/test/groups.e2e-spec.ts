import request from 'supertest';
import { hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { ErrorCode } from '@/common/enums/error-codes.enum';
import { GroupsModule } from '@/groups/groups.module';
import { Group } from '@/groups/entities/group.entity';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { User } from '@/users/entities/user.entity';
import { SeedFactory } from '@/seeder/seed.factory';
import {
  createTestServer,
  obtainAdminAuthToken,
  obtainAuthToken,
} from './utils';
import { Course } from '@/courses/entities/course.entity';

const INVALID_UUID = '00000000-0000-0000-0000-000000000000';
const TEST_USER_PASSWORD = 'password';

describe('GroupsController (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let userToken: string;

  let groups: Group[];
  let users: User[];

  beforeAll(async () => {
    app = await createTestServer(
      [AuthModule, GroupsModule, UsersModule],
      undefined,
      [SeedFactory],
    );

    groups = await app.get(SeedFactory).createMany(Group, 5);
    users = await app.get(SeedFactory).createMany(User, 3, {
      password: await hash(TEST_USER_PASSWORD, 10),
    });

    adminToken = await obtainAdminAuthToken(app);
    userToken = await obtainAuthToken(app, users[0].email, TEST_USER_PASSWORD);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /groups', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer()).post('/groups').expect(401);
    });

    it('returns 403 when the user is not an administrator', () => {
      return request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns 200 and creates a new group', async () => {
      const groupName = `Test Group ${Date.now()}`;

      const { body } = await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: groupName })
        .expect(201);

      expect(body).toMatchObject({
        id: expect.any(String),
        name: groupName,
      });
    });

    it('returns 409 when the group name already exists', async () => {
      const groupName = `Duplicate Group ${Date.now()}`;

      await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: groupName })
        .expect(201);

      await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: groupName })
        .expect(409);
    });

    it('returns 400 when the group name is empty', async () => {
      await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' })
        .expect(400);
    });

    it('assigns users to the group when user IDs are provided', async () => {
      const { body: group } = await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Group with users', users: [users[0].id] })
        .expect(201);

      const { body: user } = await request(app.getHttpServer())
        .get(`/users/${users[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(user.groups).toContainEqual(group);
    });

    it('returns 400 when a user entry is not a valid UUID', () => {
      return request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Group Invalid UUID', users: ['not-a-uuid'] })
        .expect(400);
    });

    it('returns 400 when a user entry does not exist in the database', () => {
      return request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Group Missing User', users: [INVALID_UUID] })
        .expect(400);
    });
  });

  describe('GET /groups', () => {
    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer()).get('/groups').expect(401);
    });

    it('should return all groups', async () => {
      const response = await request(app.getHttpServer())
        .get('/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(groups.length);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
    });
  });

  describe('PATCH /groups/:id', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .patch(`/groups/${groups[0].id}`)
        .send({ name: 'Updated Name' })
        .expect(401);
    });

    it('returns 403 when a non-admin user tries to update', () => {
      return request(app.getHttpServer())
        .patch(`/groups/${groups[0].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated Name' })
        .expect(403);
    });

    it('returns 404 when the group does not exist', () => {
      return request(app.getHttpServer())
        .patch(`/groups/${INVALID_UUID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);
    });

    it('returns 400 when the name is empty', () => {
      return request(app.getHttpServer())
        .patch(`/groups/${groups[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' })
        .expect(400);
    });

    it('returns 200 with the updated group', async () => {
      const newName = `Renamed Group ${Date.now()}`;

      const { body } = await request(app.getHttpServer())
        .patch(`/groups/${groups[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: newName })
        .expect(200);

      expect(body).toMatchObject({ id: groups[0].id, name: newName });
    });

    it('assigns users to the group when user IDs are provided', async () => {
      await request(app.getHttpServer())
        .patch(`/groups/${groups[1].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ users: [users[1].id] })
        .expect(200);

      const { body: user } = await request(app.getHttpServer())
        .get(`/users/${users[1].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(user.groups).toContainEqual(groups[1]);
    });

    it('removes users from the group that are not in the provided list', async () => {
      await request(app.getHttpServer())
        .patch(`/groups/${groups[2].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ users: [users[1].id, users[2].id] })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/groups/${groups[2].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ users: [users[0].id] })
        .expect(200);

      const repo = app.get<Repository<Group>>(getRepositoryToken(Group));
      const group = await repo.findOneOrFail({
        where: { id: groups[2].id },
        relations: { users: true },
      });

      expect(group.users).toHaveLength(1);
      expect(group.users[0].id).toBe(users[0].id);
    });

    it('does not duplicate users already in the group', async () => {
      await request(app.getHttpServer())
        .patch(`/groups/${groups[3].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ users: [users[0].id] })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/groups/${groups[3].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ users: [users[0].id] })
        .expect(200);

      const { body: user } = await request(app.getHttpServer())
        .get(`/users/${users[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(user.groups).toContainEqual(groups[3]);
    });

    it('returns 400 when a user entry is not a valid UUID', () => {
      return request(app.getHttpServer())
        .patch(`/groups/${groups[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ users: ['not-a-uuid'] })
        .expect(400);
    });

    it('returns 400 when a user entry does not exist in the database', () => {
      return request(app.getHttpServer())
        .patch(`/groups/${groups[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ users: [INVALID_UUID] })
        .expect(400);
    });
  });

  describe('DELETE /groups/:id', () => {
    it('returns 404 when the group does not exist', () => {
      return request(app.getHttpServer())
        .delete('/groups/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when a non-admin attempts to delete a group', () => {
      return request(app.getHttpServer())
        .delete(`/groups/${groups[3].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('returns 400 when users are assigned to the group', async () => {
      const { body: group } = await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `gusr-${Date.now()}`, users: [users[0].id] })
        .expect(201);

      const res = await request(app.getHttpServer())
        .delete(`/groups/${group.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body.code).toBe(ErrorCode.GROUP_HAS_ASSIGNMENTS);
    });

    it('returns 400 when courses are assigned to the group', async () => {
      await app.get(SeedFactory).create(Course, { groups: [groups[0]] });

      const res = await request(app.getHttpServer())
        .delete(`/groups/${groups[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body.code).toBe(ErrorCode.GROUP_HAS_ASSIGNMENTS);
    });

    it('deletes a group and returns 204', async () => {
      await request(app.getHttpServer())
        .delete(`/groups/${groups[4].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .delete(`/groups/${groups[4].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
