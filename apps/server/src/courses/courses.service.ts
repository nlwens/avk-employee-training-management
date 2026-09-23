import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupsService } from '@/groups/groups.service';
import { Course } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { CourseTranslation } from './entities/course-translation.entity';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseStatsDto } from './dto/course-stats.dto';
import { CoursesRepository } from './courses.repository';

@Injectable()
export class CoursesService {
  constructor(
    private readonly courseRepository: CoursesRepository,
    @InjectRepository(CourseTranslation)
    private readonly translationRepository: Repository<CourseTranslation>,
    private readonly groupsService: GroupsService,
  ) {}

  async assertAccessible(
    courseId: string,
    userGroupIds: string[],
  ): Promise<void> {
    if (
      !(await this.courseRepository.isAccessibleToGroups(
        courseId,
        userGroupIds,
      ))
    ) {
      throw new ForbiddenException();
    }
  }

  findOne(id: string): Promise<Course> {
    return this.courseRepository.findOneOrFail({
      where: { id },
      relations: { groups: true },
    });
  }

  async findOneDetail(id: string, userId?: string): Promise<Course> {
    const course = await this.findOne(id);

    // Attach additional information to the entity.
    await this.courseRepository.attachUserStatistics([course], userId);

    return course;
  }

  findAll(
    userId?: string,
    search?: string,
    published?: boolean,
    finished?: boolean,
    page = 1,
    limit = 20,
  ): Promise<[Course[], number]> {
    return this.courseRepository.findAll({
      userId,
      search,
      published,
      finished,
      page,
      limit,
    });
  }

  findAllForGroups(
    groups: string[],
    userId?: string,
    search?: string,
    finished?: boolean,
    page = 1,
    limit = 20,
  ): Promise<[Course[], number]> {
    return this.courseRepository.findForGroups({
      groupIds: groups,
      userId,
      search,
      finished,
      page,
      limit,
    });
  }

  /**
   * Calculates and retrieves statistics for a course.
   *
   * The average score only includes users who answered every course question.
   */
  getStats(courseId: string): Promise<CourseStatsDto> {
    return this.courseRepository.getStats(courseId);
  }

  getQuizResults(courseId: string) {
    return this.courseRepository.getQuizResults(courseId);
  }

  async create(dto: CreateCourseDto): Promise<Course> {
    const groups = dto.groups?.length
      ? await this.groupsService.findByIds(dto.groups)
      : [];

    const course = await this.courseRepository.save(
      this.courseRepository.create({
        groups,
        priority: dto.priority,
      }),
    );

    course.translations = await this.translationRepository.save(
      dto.translations.map(({ locale, title, content }) =>
        this.translationRepository.create({
          courseId: course.id,
          localeCode: locale,
          title,
          content,
        }),
      ),
    );

    return course;
  }

  async update(dto: UpdateCourseDto, course: Course): Promise<Course> {
    const groups = dto.groups?.length
      ? await this.groupsService.findByIds(dto.groups)
      : [];

    if (dto.groups !== undefined) {
      course.groups = groups;
    }

    if (dto.published !== undefined) {
      course.published = dto.published;
    }

    if (dto.priority !== undefined) {
      course.priority = dto.priority;
    }

    if (dto.translations !== undefined) {
      for (const translation of dto.translations) {
        await this.translationRepository.upsert(
          {
            courseId: course.id,
            localeCode: translation.locale,
            title: translation.title,
            content: translation.content,
          },
          ['courseId', 'localeCode'],
        );
      }

      course.translations = await this.translationRepository.find({
        where: { courseId: course.id },
        order: { localeCode: 'ASC' },
      });
    }

    return await this.courseRepository.save(course);
  }

  async delete(courseId: string): Promise<void> {
    const course = await this.courseRepository.findOneByOrFail({
      id: courseId,
    });

    await this.courseRepository.delete({ id: course.id });
  }
}
