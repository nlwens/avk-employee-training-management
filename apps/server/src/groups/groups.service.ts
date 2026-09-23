import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCode } from '@/common/enums/error-codes.enum';
import { User } from '@/users/entities/user.entity';
import { Group } from './entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    private readonly dataSource: DataSource,
  ) {}

  findOne(id: string): Promise<Group> {
    return this.groupRepository.findOneByOrFail({ id });
  }

  findByIds(ids: string[]): Promise<Group[]> {
    return this.groupRepository.findBy({ id: In(ids) });
  }

  getAllGroups(): Promise<Group[]> {
    return this.groupRepository.find();
  }

  async createGroup(dto: CreateGroupDto): Promise<Group> {
    const { name } = dto;

    if (await this.groupRepository.existsBy({ name })) {
      throw new ConflictException(`Group with name '${name}' already exists`);
    }

    const group = await this.groupRepository.save(
      this.groupRepository.create({ name }),
    );

    if (dto.users !== undefined) {
      await this.syncGroupUsers(group, dto.users);
    }

    return group;
  }

  async update(group: Group, dto: UpdateGroupDto): Promise<Group> {
    if (dto.name !== undefined) {
      group.name = dto.name;
    }

    await this.groupRepository.save(group);

    if (dto.users !== undefined) {
      await this.syncGroupUsers(group, dto.users);
    }

    return group;
  }

  async delete(groupId: string): Promise<void> {
    const group = await this.groupRepository.findOneByOrFail({ id: groupId });

    if (
      (await this.hasAssignedUsers(group.id)) ||
      (await this.hasAssignedCourses(group.id))
    ) {
      throw new BadRequestException({
        message: 'The group has users or courses assigned to it',
        code: ErrorCode.GROUP_HAS_ASSIGNMENTS,
      });
    }

    await this.groupRepository.delete({ id: group.id });
  }

  private async syncGroupUsers(group: Group, users: string[]): Promise<void> {
    // We want to avoid loading user entities and executing an expensive save.
    // Ref.: https://typeorm.io/docs/query-builder/relational-query-builder/
    const relation = this.groupRepository
      .createQueryBuilder()
      .relation(Group, 'users')
      .of(group.id);

    // First, load the users that are already assigned to the group.
    const current = await relation.loadMany<User>();

    // Create sets of the current and new IDs resulting in a diff between them.
    const currentIds = new Set(current.map((u) => u.id));
    const nextIds = new Set(users);

    // Add only new users and remove users that are no longer assigned.
    await relation.addAndRemove(
      [...nextIds].filter((id) => !currentIds.has(id)),
      [...currentIds].filter((id) => !nextIds.has(id)),
    );
  }

  private hasAssignedUsers(groupId: string): Promise<boolean> {
    return this.dataSource
      .createQueryBuilder()
      .from('users_groups', 'ug')
      .where('ug.group_id = :groupId', { groupId })
      .getExists();
  }

  private hasAssignedCourses(groupId: string): Promise<boolean> {
    return this.dataSource
      .createQueryBuilder()
      .from('courses_groups', 'cg')
      .where('cg.group_id = :groupId', { groupId })
      .getExists();
  }
}
