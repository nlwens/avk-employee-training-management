import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { AdminOnly } from '@/auth/decorators/admin-only.decorator';
import { Auth } from '@/auth/decorators/auth.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { UsersService } from '@/users/users.service';
import { User } from '@/users/entities/user.entity';
import { CoursesService } from './courses.service';
import { CoursesCsvService } from './courses-csv.service';
import { PaginatedCourseDto } from './dto/paginated-course.dto';
import { PublicQueryCourseParamsDto } from './dto/query-course-params.dto';

@ApiTags('Users')
@Controller('users')
export class UserCoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly coursesCsvService: CoursesCsvService,
    private readonly usersService: UsersService,
  ) {}

  @Get(':id/course-stats')
  @Auth()
  @Serialize(PaginatedCourseDto)
  @ApiOperation({
    summary: 'Get course stats for a user',
    description:
      'Returns a paginated list of published courses accessible to the user, with completed chapters and correct answers' +
      'for questions. Administrators can access stats for any user; regular users can only access their own.',
  })
  @ApiOkResponse({ type: PaginatedCourseDto })
  @ApiForbiddenResponse({
    description: 'Accessing other user without administrator access',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async courseStats(
    @Param('id', ParseUUIDPipe) userId: string,
    @CurrentUser() currentUser: User,
    @Query() query: PublicQueryCourseParamsDto,
  ): Promise<PaginatedCourseDto> {
    if (!currentUser.admin && currentUser.id !== userId) {
      throw new ForbiddenException();
    }

    const user = await this.usersService.findOne(userId);

    const { page, limit, search } = query;

    const [courses, total] = await this.coursesService.findAllForGroups(
      user.groups.map((group) => group.id),
      userId,
      search,
      // This endpoint does not expose the finished filter.
      undefined,
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

  @Get(':id/course-stats/download')
  @AdminOnly()
  @ApiOperation({
    summary: 'Download course scores as CSV',
    description:
      'Returns a CSV file with course statistics for the specified user. ' +
      'Only published courses accessible to the user are included. ' +
      "Column headers and course names follow the user's locale.",
  })
  @ApiProduces('text/csv')
  @ApiOkResponse({
    description: 'CSV file download containing course scores for the user',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async downloadCourseScores(
    @Param('id', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
  ): Promise<StreamableFile> {
    const targetUser = await this.usersService.findOne(userId);

    const { csv, filename } =
      await this.coursesCsvService.buildCourseScoresDownload(
        targetUser,
        user.localeCode,
      );

    return new StreamableFile(Buffer.from(csv, 'utf-8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}
