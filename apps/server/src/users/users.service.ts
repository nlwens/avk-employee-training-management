import { compare, hash } from 'bcrypt';
import { FindOptionsWhere, ILike, Not, Repository } from 'typeorm';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GroupsService } from '@/groups/groups.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { QueryUserParamsDto } from './dto/query-user-params.dto';

@Injectable()
export class UsersService {
  private readonly saltRounds = 12;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly groupsService: GroupsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  findOne(id: string): Promise<User> {
    return this.usersRepository.findOneByOrFail({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async findAll(searchParams: QueryUserParamsDto): Promise<User[]> {
    let where: FindOptionsWhere<User>[] | undefined;

    if (searchParams.search) {
      const keywords = searchParams.search.trim().split(' ').filter(Boolean);

      // each keyword must match in either name or surname
      where = keywords
        .map((keyword) => [
          { name: ILike(`%${keyword}%`) },
          { surname: ILike(`%${keyword}%`) },
        ])
        .flat();
    }

    return this.usersRepository.find({ where });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    await this.ensureEmailAvailable(createUserDto.email);

    const groups =
      createUserDto.groups !== undefined
        ? createUserDto.groups.length === 0
          ? []
          : await this.groupsService.findByIds(createUserDto.groups)
        : undefined;

    const user = await this.usersRepository.save(
      this.usersRepository.create({
        email: createUserDto.email,
        password: await this.hashPassword(this.generateRandomPassword()),
        name: createUserDto.name,
        surname: createUserDto.surname,
        ...(createUserDto.admin !== undefined && {
          admin: createUserDto.admin,
        }),
        ...(createUserDto.locale !== undefined && {
          localeCode: createUserDto.locale,
        }),
        ...(groups !== undefined && { groups }),
      }),
    );

    this.eventEmitter.emit('user.created', user);

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id },
      relations: ['groups'],
    });

    if (updateUserDto.name !== undefined) {
      user.name = updateUserDto.name;
    }

    if (updateUserDto.surname !== undefined) {
      user.surname = updateUserDto.surname;
    }

    if (updateUserDto.email !== undefined) {
      await this.ensureEmailAvailable(updateUserDto.email, id);
      user.email = updateUserDto.email;
    }

    if (updateUserDto.password !== undefined) {
      user.password = await this.hashPassword(updateUserDto.password);
    }

    if (updateUserDto.admin !== undefined) {
      user.admin = updateUserDto.admin;
    }

    if (updateUserDto.groups !== undefined) {
      user.groups =
        updateUserDto.groups.length > 0
          ? await this.groupsService.findByIds(updateUserDto.groups)
          : [];
    }

    return this.usersRepository.save(user);
  }

  async delete(userId: string): Promise<void> {
    await this.usersRepository.delete({ id: userId });
  }

  async updateMe(user: User, data: UpdateMeDto): Promise<User> {
    if (data.currentPassword !== undefined) {
      if (!(await compare(data.currentPassword, user.password))) {
        throw new ForbiddenException('Current password is incorrect');
      }

      if (data.password !== undefined) {
        user.password = await this.hashPassword(data.password);
      }
    }

    if (data.locale !== undefined) {
      user.localeCode = data.locale;
    }

    return this.usersRepository.save(user);
  }

  async createAdminUser(): Promise<void> {
    // Create the administrator user only if it does not exist yet.
    if ((await this.usersRepository.countBy({ admin: true })) > 0) {
      return;
    }

    const email = this.configService.get<string>(
      'ADMIN_EMAIL',
      'admin@example.com',
    );
    const password = this.configService.get<string>(
      'ADMIN_PASSWORD',
      'password',
    );

    await this.usersRepository.save(
      this.usersRepository.create({
        name: 'Administrator',
        surname: 'User',
        email,
        password: await this.hashPassword(password),
        admin: true,
      }),
    );
  }

  async hashPassword(password: string): Promise<string> {
    return hash(password, this.saltRounds);
  }

  private async ensureEmailAvailable(
    email: string,
    excludeUserId?: string,
  ): Promise<void> {
    const existingUser = await this.usersRepository.findOne({
      where: excludeUserId
        ? {
            email,
            id: Not(excludeUserId),
          }
        : { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
  }

  private generateRandomPassword(): string {
    return Math.random().toString(36).slice(2);
  }
}
