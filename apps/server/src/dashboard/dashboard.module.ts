import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/users/entities/user.entity';
import { Group } from '@/groups/entities/group.entity';
import { Course } from '@/courses/entities/course.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Group, Course])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
