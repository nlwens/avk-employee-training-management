import request from 'supertest';
import { App } from 'supertest/types';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  INestApplication,
  Module,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  InjectRepository,
  TypeOrmModule,
  getRepositoryToken,
} from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog as AuditLogEntity } from '@/audit-log/entities/audit-log.entity';
import { AuditLog } from '@/audit-log/decorators/audit-log.decorator';
import { AuditAction } from '@/audit-log/enums/audit-action.enum';
import { AuditLogModule } from '@/audit-log/audit-log.module';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { Group } from '@/groups/entities/group.entity';
import { AuthModule } from '@/auth/auth.module';
import { Auth } from '@/auth/decorators/auth.decorator';
import { UsersModule } from '@/users/users.module';
import { UsersService } from '@/users/users.service';
import { User } from '@/users/entities/user.entity';
import { createTestServer, getAdminEmail, obtainAdminAuthToken } from './utils';

// We cannot define a custom entity for testing, so we use the Group entity.
type TestEntity = Group;

@Auth()
@AuditLog('entities.')
@Controller('test/audit-log')
class TestController {
  constructor(
    @InjectRepository(Group)
    private readonly entities: Repository<TestEntity>,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  async create(@Body() body: { name: string }) {
    return this.entities.save(this.entities.create({ name: body.name }));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { name: string }) {
    const entity = await this.entities.findOneByOrFail({ id });
    entity.name = body.name;
    return this.entities.save(entity);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    const entity = await this.entities.findOneByOrFail({ id });
    await this.entities.remove(entity);
  }

  @Post('manual')
  @AuditLog('entities.manual')
  async manual() {
    await this.auditLogService.log({ action: AuditAction.LOGIN });
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([Group]),
    AuditLogModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [TestController],
})
class TestModule {}

let app: INestApplication<App>;
let auditRepo: Repository<AuditLogEntity>;
let adminToken: string;
let admin: User;

beforeAll(async () => {
  app = await createTestServer([TestModule]);
  auditRepo = app.get(getRepositoryToken(AuditLogEntity));

  adminToken = await obtainAdminAuthToken(app);
  admin = (await app.get(UsersService).findByEmail(getAdminEmail(app))) as User;
});

afterAll(() => app.close());

beforeEach(() => auditRepo.clear());

describe('AuditSubscriber (e2e)', () => {
  it('records a CREATED entry after an entity is inserted', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/test/audit-log')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'create' })
      .expect(201);

    const entries = await auditRepo.find();
    expect(entries).toHaveLength(1);
    expect(entries[0].actorId).toBe(admin.id);
    expect(entries[0].action).toBe(AuditAction.CREATED);
    expect(entries[0].entityType).toBe('Group');
    expect(entries[0].entityKeys).toMatchObject({ id: body.id });
    expect(entries[0].route).toBe('POST /test/audit-log');
    expect(entries[0].operation).toBe('entities.create');
    expect(entries[0].before).toBeNull();
    expect(entries[0].after).toMatchObject({ id: body.id, name: body.name });
    expect(entries[0].entityKeys).toMatchObject({ id: body.id });
  });

  it('records an UPDATED entry with before and after state', async () => {
    const { body: created } = await request(app.getHttpServer())
      .post('/test/audit-log')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'foo' })
      .expect(201);

    const { body: updated } = await request(app.getHttpServer())
      .patch(`/test/audit-log/${created.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'update' })
      .expect(200);

    const entries = await auditRepo.findBy({ action: AuditAction.UPDATED });
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].actorId).toBe(admin.id);
    expect(entries[0].entityType).toBe('Group');
    expect(entries[0].route).toBe('PATCH /test/audit-log/:id');
    expect(entries[0].operation).toBe('entities.update');
    expect(entries[0].before).toMatchObject({ name: created.name });
    expect(entries[0].after).toMatchObject({ name: updated.name });
    expect(entries[0].entityKeys).toMatchObject({ id: updated.id });
  });

  it('records a DELETED entry with before state and null after', async () => {
    const { body: created } = await request(app.getHttpServer())
      .post('/test/audit-log')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'bar' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/test/audit-log/${created.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    const entries = await auditRepo.findBy({ action: AuditAction.DELETED });
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].actorId).toBe(admin.id);
    expect(entries[0].entityType).toBe('Group');
    expect(entries[0].operation).toBe('entities.delete');
    expect(entries[0].route).toBe('DELETE /test/audit-log/:id');
    expect(entries[0].before).toMatchObject({
      id: created.id,
      name: created.name,
    });
    expect(entries[0].after).toBeNull();
    expect(entries[0].entityKeys).toMatchObject({ id: created.id });
  });

  it('records a manually logged entry with the overridden operation', async () => {
    await request(app.getHttpServer())
      .post('/test/audit-log/manual')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const entries = await auditRepo.find();
    expect(entries).toHaveLength(1);
    expect(entries[0].actorId).toBe(admin.id);
    expect(entries[0].action).toBe(AuditAction.LOGIN);
    expect(entries[0].operation).toBe('entities.manual');
  });
});
