import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
@EventSubscriber()
export class UsersSubscriber
  implements EntitySubscriberInterface<User>, OnModuleInit
{
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  onModuleInit(): void {
    this.dataSource.subscribers.push(this);
  }

  listenTo(): typeof User {
    return User;
  }

  beforeUpdate(event: UpdateEvent<User>): void {
    const passwordChanged = event.updatedColumns.some(
      (column) => column.propertyName === 'password',
    );

    // TypeORM recomputes the changeset after this event, so the new value is
    // persisted within the same UPDATE.
    if (passwordChanged && event.entity) {
      event.entity.passwordChangedAt = new Date();
    }
  }
}
