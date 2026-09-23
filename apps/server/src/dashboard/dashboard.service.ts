import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { Group } from '@/groups/entities/group.entity';
import { Course } from '@/courses/entities/course.entity';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async getStats(): Promise<DashboardStatsDto> {
    const [totalEmployees, publishedCourses, groups] = await Promise.all([
      this.countEmployees(),
      this.countPublishedCourses(),
      this.countGroups(),
    ]);

    return {
      totalEmployees,
      publishedCourses,
      groups,
    };
  }

  private countEmployees(): Promise<number> {
    return this.userRepository.count({});
  }

  private countPublishedCourses(): Promise<number> {
    return this.courseRepository.count({
      where: { published: true },
    });
  }

  private countGroups(): Promise<number> {
    return this.groupRepository.count();
  }
}
