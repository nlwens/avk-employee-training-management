import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { UsersModule } from '@/users/users.module';
import { AuthModule } from '@/auth/auth.module';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { ENGLISH_LOCALE, DUTCH_LOCALE } from '@/locales/locales';
import {
  createTestServer,
  obtainAdminAuthToken,
  obtainAuthToken,
} from './utils';
import { SeedFactory } from '@/seeder/seed.factory';
import { Group } from '@/groups/entities/group.entity';
import { User } from '@/users/entities/user.entity';
import { hash } from 'bcrypt';

const TEST_USER_PASSWORD = 'password';

const validUserPayload = (): CreateUserDto => ({
  name: 'Jane',
  surname: 'Doe',
  email: `new-user-${Date.now()}@example.com`,
});

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;

  let adminToken: string;
  let nonAdminToken: string;

  let user: User;
  let userGroup: Group;

  beforeAll(async () => {
    app = await createTestServer([UsersModule, AuthModule], undefined, [
      SeedFactory,
    ]);

    const factory = app.get(SeedFactory);

    userGroup = await factory.create(Group);

    user = await factory.create(User, {
      name: 'Uniquetestname',
      surname: 'Uniquetestsurname',
      password: await hash(TEST_USER_PASSWORD, 10),
      groups: [userGroup],
    });

    nonAdminToken = await obtainAuthToken(app, user.email, TEST_USER_PASSWORD);
    adminToken = await obtainAdminAuthToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users (admin-only create)', () => {
    it('returns 201 and user fields when an admin creates a user', async () => {
      const payload = validUserPayload();

      const { body } = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...payload, locale: ENGLISH_LOCALE })
        .expect(201);

      expect(body).toMatchObject({
        id: expect.any(String),
        name: payload.name,
        surname: payload.surname,
        email: payload.email,
        localeCode: ENGLISH_LOCALE,
        admin: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      expect(body.password).toBeUndefined();
      expect(body.passwordChangedAt).toBeUndefined();
    });

    it('returns 401 when no Authorization header is sent', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send(validUserPayload())
        .expect(401);
    });

    it('returns 401 for a malformed Bearer token', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', 'Bearer not-a-valid-jwt')
        .send(validUserPayload())
        .expect(401);
    });

    it('returns 403 when a non-admin user is authenticated', async () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send(validUserPayload())
        .expect(403);
    });

    it('returns 409 when the email already exists', async () => {
      const body = validUserPayload();

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(body)
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...body, name: 'Other', surname: 'Person' })
        .expect(409);

      expect(res.body.message).toBe('Email already exists');
    });

    describe('validation (400)', () => {
      it('returns 400 when name is too short', () => {
        const body = validUserPayload();

        return request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...body, name: 'J' })
          .expect(400);
      });

      it('returns 400 when surname exceeds max length', () => {
        const body = validUserPayload();

        return request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...body, surname: 'x'.repeat(51) })
          .expect(400);
      });

      it('returns 400 for an invalid email', () => {
        const body = validUserPayload();

        return request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...body, email: 'not-an-email' })
          .expect(400);
      });

      it('returns 400 when a required field is missing', () => {
        const body = validUserPayload();

        return request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: body.name, surname: body.surname })
          .expect(400);
      });
    });
  });

  describe('GET /users', () => {
    it('returns 200 with an array of all users', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(body.length).toBeGreaterThan(0);
      expect(body[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        surname: expect.any(String),
        email: expect.any(String),
      });

      expect(body[0].password).toBeUndefined();
      expect(body[0].passwordChangedAt).toBeUndefined();
    });

    it('returns 200 with an array of all users, filtered by a search name and surname parameters', async () => {
      const { body } = await request(app.getHttpServer())
        .get(
          `/users?search=   ${user.name.toLowerCase()}   ${user.surname.toLowerCase()}   `,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(body.length).toBeGreaterThan(0);
      expect(body[0]).toMatchObject({
        name: user.name,
        surname: user.surname,
        groups: [{ id: userGroup.id }],
      });

      expect(body[0].password).toBeUndefined();
      expect(body[0].passwordChangedAt).toBeUndefined();
    });

    it('returns 200 with an array of all users, filtered by a surname parameter', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/users?search=${user.surname.toLowerCase()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(body.length).toBeGreaterThan(0);
      expect(body[0]).toMatchObject({
        name: user.name,
        surname: user.surname,
        groups: [{ id: userGroup.id }],
      });

      expect(body[0].password).toBeUndefined();
      expect(body[0].passwordChangedAt).toBeUndefined();
    });

    it('returns 200 with an array of all users, filtered by a not whole name parameter', async () => {
      const name = user.name.toLowerCase().slice(0, 6);

      const { body } = await request(app.getHttpServer())
        .get(`/users?search=${name}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(body.length).toBeGreaterThan(0);
      expect(body[0]).toMatchObject({
        name: user.name,
        surname: user.surname,
        groups: [{ id: userGroup.id }],
      });

      expect(body[0].password).toBeUndefined();
      expect(body[0].passwordChangedAt).toBeUndefined();
    });

    it('returns 200 with an empty array when filtered name is unknown', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?search=unknown')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
      expect(response.body).toStrictEqual([]);
    });

    it('returns 401 Unauthorized when no admin token is provided', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'Bearer not-admin-token')
        .expect(401);
    });

    it('returns 403 Forbidden when user is not an administrator', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(403);
    });
  });

  describe('GET /users/:userId', () => {
    it('returns 404 when the user does not exist', () => {
      return request(app.getHttpServer())
        .get('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when a non-admin attempts to access another user', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validUserPayload())
        .expect(201);

      return request(app.getHttpServer())
        .get(`/users/${createRes.body.id}`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(403);
    });

    it('returns 200 when an admin retrieves a user with groups', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(body).toMatchObject({
        id: user.id,
        groups: [{ id: userGroup.id }],
      });

      expect(body.password).toBeUndefined();
      expect(body.passwordChangedAt).toBeUndefined();
    });

    it('returns 200 when a user retrieves their own profile', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(200);

      expect(body.id).toBe(user.id);
      expect(body.password).toBeUndefined();
      expect(body.passwordChangedAt).toBeUndefined();
    });
  });

  describe('PATCH /users/:userId', () => {
    it('returns 200 when an admin updates a user', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated', surname: 'Regular' })
        .expect(200);

      expect(body).toMatchObject({
        id: user.id,
        name: 'Updated',
        surname: 'Regular',
        admin: false,
      });

      expect(body.password).toBeUndefined();
      expect(body.passwordChangedAt).toBeUndefined();
    });

    it('returns 400 when password is shorter than 8 characters', () => {
      const body = validUserPayload();

      return request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...body, password: 'short' })
        .expect(400);
    });

    it('returns 404 when the user does not exist', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ghost' })
        .expect(404);

      expect(res.body.message).toBe('Not Found');
    });

    it('returns 409 when the email is already taken by another user', async () => {
      const other = validUserPayload();

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(other)
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: other.email })
        .expect(409);

      expect(res.body.message).toBe('Email already exists');
    });

    it('returns 401 when no token is sent', () => {
      return request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .send({ name: 'X' })
        .expect(401);
    });

    it('returns 403 when a non-admin is authenticated', () => {
      return request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({ name: 'X' })
        .expect(403);
    });

    it('associates groups when groups are sent', async () => {
      const groupRes = await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `User PUT group ${Date.now()}` })
        .expect(201);

      const { body } = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groups: [groupRes.body.id] })
        .expect(200);

      expect(body).toMatchObject({ groups: [{ id: groupRes.body.id }] });

      expect(body.password).toBeUndefined();
      expect(body.passwordChangedAt).toBeUndefined();
    });
  });

  describe('DELETE /users/:userId', () => {
    it('returns 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .delete(`/users/${user.id}`)
        .expect(401);
    });

    it('returns 404 when the user does not exist', () => {
      return request(app.getHttpServer())
        .delete('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns 403 when a non-admin attempts to delete a user', () => {
      return request(app.getHttpServer())
        .delete(`/users/${user.id}`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(403);
    });

    it('deletes a user and returns 204', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validUserPayload())
        .expect(201);

      const userId = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /users/@me', () => {
    it('returns 401 when no Authorization header is sent', () => {
      return request(app.getHttpServer())
        .patch('/users/@me')
        .send({ locale: ENGLISH_LOCALE })
        .expect(401);
    });

    it('returns 200 and updates the locale', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/users/@me')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({ locale: DUTCH_LOCALE })
        .expect(200);

      expect(body.localeCode).toBe(DUTCH_LOCALE);
      expect(body.password).toBeUndefined();
      expect(body.passwordChangedAt).toBeUndefined();
    });

    it('returns 200 and restores the locale back to English', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/users/@me')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({ locale: ENGLISH_LOCALE })
        .expect(200);

      expect(body.localeCode).toBe(ENGLISH_LOCALE);
    });

    it('returns 200 and changes the password when both passwords are correct', async () => {
      const password = 'VeryNewSecurePassword123@';

      await request(app.getHttpServer())
        .patch('/users/@me')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({ currentPassword: TEST_USER_PASSWORD, password })
        .expect(200);

      // The token that predates the password change is now rejected.
      await request(app.getHttpServer())
        .patch('/users/@me')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({ locale: ENGLISH_LOCALE })
        .expect(401);

      // Get the new token, which also checks that the new password is valid.
      nonAdminToken = await obtainAuthToken(app, user.email, password);

      // Revert the password, which also checks that the new token is valid.
      await request(app.getHttpServer())
        .patch('/users/@me')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({ currentPassword: password, password: TEST_USER_PASSWORD })
        .expect(200);

      // Get the new token again, so other executed tests succeed.
      nonAdminToken = await obtainAuthToken(
        app,
        user.email,
        TEST_USER_PASSWORD,
      );
    });

    it('ignores non-whitelisted fields', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/users/@me')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({ id: '123', name: 'Hacker', email: 'hacker@example.com' })
        .expect(200);

      expect(body.id).not.toBe('123');
      expect(body.name).not.toBe('Hacker');
      expect(body.email).toBeUndefined();
    });

    it('returns 403 when currentPassword is wrong', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/users/@me')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({ currentPassword: 'WrongPassword1!', password: 'NewPwd12345!' })
        .expect(403);

      expect(body.message).toBe('Current password is incorrect');
    });

    it('returns 400 when password is present but currentPassword is missing', () => {
      return request(app.getHttpServer())
        .patch('/users/@me')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({ password: 'NewPassword1!' })
        .expect(400);
    });

    it('returns 400 when locale does not exist in the database', () => {
      return request(app.getHttpServer())
        .patch('/users/@me')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({ locale: 'xx' })
        .expect(400);
    });
  });
});
