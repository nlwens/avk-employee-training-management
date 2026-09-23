import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '@/auth/decorators/auth.decorator';
import { AdminOnly } from '@/auth/decorators/admin-only.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { User } from '@/users/entities/user.entity';
import { AuditLog } from '@/audit-log/decorators/audit-log.decorator';
import { CoursesService } from './courses.service';
import { CourseDetailDto } from './dto/course-detail.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseParamsDto } from './dto/query-course-params.dto';
import { PaginatedCourseDto } from './dto/paginated-course.dto';
import { CourseStatsDto } from './dto/course-stats.dto';
import { CourseQuizResultDto } from './dto/course-quiz-result.dto';

@ApiTags('Courses')
@AuditLog('courses.')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @Auth()
  @Serialize(PaginatedCourseDto)
  @ApiOperation({
    summary: 'List all courses',
    description:
      'Returns a paginated list of courses. Admins can see all courses, while regular users' +
      'only see published courses that are public or assigned to one of their groups. ' +
      'Optional search filters courses by title or description/content across all locales.',
  })
  @ApiOkResponse({ type: PaginatedCourseDto })
  async list(
    @CurrentUser() user: User,
    @Query() query: QueryCourseParamsDto,
  ): Promise<PaginatedCourseDto> {
    const page = query.page;
    const limit = query.limit;

    const [courses, total] = user.admin
      ? await this.coursesService.findAll(
          user.id,
          query.search,
          query.published,
          query.finished,
          page,
          limit,
        )
      : await this.coursesService.findAllForGroups(
          user.groups.map((group) => group.id),
          user.id,
          query.search,
          query.finished,
          page,
          limit,
        );

    return {
      data: courses,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  @Get(':id')
  @Auth()
  @Serialize(CourseDetailDto)
  @ApiOperation({
    summary: 'Get a single course',
    description:
      'Returns course details. Admins can access any course, while regular users can' +
      'only access published courses that are public or assigned to one of their groups.',
  })
  @ApiOkResponse({ type: CourseDetailDto })
  @ApiForbiddenResponse({ description: 'Missing access to this course' })
  @ApiNotFoundResponse({ description: 'Course not found' })
  async detail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<CourseDetailDto> {
    const course = await this.coursesService.findOneDetail(id, user.id);

    if (!user.admin) {
      await this.coursesService.assertAccessible(
        id,
        user.groups.map((group) => group.id),
      );
    }

    return course;
  }

  @Get(':id/stats')
  @AdminOnly()
  @Serialize(CourseStatsDto)
  @ApiOperation({
    summary: 'Get course question count and average score stats',
    description:
      'Returns the total number of questions and the average score percentage for users ' +
      'who answered all questions in the course. Administrator access is required.',
  })
  @ApiOkResponse({ type: CourseStatsDto })
  @ApiNotFoundResponse({ description: 'Course not found' })
  stats(@Param('id', ParseUUIDPipe) id: string): Promise<CourseStatsDto> {
    return this.coursesService.getStats(id);
  }

  @Get(':id/quiz-results')
  @AdminOnly()
  @Serialize(CourseQuizResultDto)
  @ApiOperation({
    summary: 'Get per-user quiz results for a course',
    description:
      'Returns each user who completed the quiz (answered all questions in the course) ' +
      'with their score and submission date. Administrator access is required.',
  })
  @ApiOkResponse({ type: [CourseQuizResultDto] })
  @ApiNotFoundResponse({ description: 'Course not found' })
  quizResults(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.getQuizResults(id);
  }

  @Post()
  @AdminOnly()
  @Serialize(CourseDetailDto)
  @ApiOperation({ summary: 'Create a new course' })
  @ApiCreatedResponse({ type: CourseDetailDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  create(@Body() body: CreateCourseDto): Promise<CourseDetailDto> {
    return this.coursesService.create(body);
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Updates an existing course' })
  @ApiOkResponse({ type: CourseDetailDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiNotFoundResponse({ description: 'Course not found' })
  async edit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCourseDto,
  ): Promise<CourseDetailDto> {
    const course = await this.coursesService.findOne(id);
    return await this.coursesService.update(body, course);
  }

  @Delete(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiNoContentResponse({ description: 'Course deleted successfully' })
  @ApiNotFoundResponse({ description: 'Course not found' })
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.coursesService.delete(id);
  }
}
