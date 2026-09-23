import { Injectable, Logger } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { GroupsService } from '@/groups/groups.service';
import { Group } from '@/groups/entities/group.entity';
import { SeedFactory } from '@/seeder/seed.factory';
import { User } from './entities/user.entity';

@Injectable()
export class UsersSeeder {
  private readonly logger = new Logger(UsersSeeder.name);

  constructor(
    private readonly factory: SeedFactory,
    private readonly groupsService: GroupsService,
  ) {}

  async seed(count = 5, overrideGroups?: Group[]): Promise<User[]> {
    this.logger.log(`Seeding ${count} users...`);

    const users: User[] = [];

    const groups = await this.groupsService.getAllGroups();

    for (let i = 0; i < count; i++) {
      const user = await this.factory.create(User, {
        groups:
          overrideGroups ??
          faker.helpers.arrayElements(groups, { min: 0, max: 3 }),
      });

      users.push(user);
    }

    return users;
  }
}
