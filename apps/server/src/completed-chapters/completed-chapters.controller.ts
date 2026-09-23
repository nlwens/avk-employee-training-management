import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '@/auth/decorators/auth.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { CoursesService } from '@/courses/courses.service';
import { User } from '@/users/entities/user.entity';
import { CompletedChaptersService } from './completed-chapters.service';
import { CompleteChapterDto } from './dto/complete-chapter.dto';
import { CompletedChapterDto } from './dto/completed-chapter.dto';

@ApiTags('Completed Chapters')
@Auth()
@Serialize(CompletedChapterDto)
@Controller('courses/:courseId/completed-chapters')
export class CompletedChaptersController {
  constructor(
    private readonly completedChaptersService: CompletedChaptersService,
    private readonly coursesService: CoursesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List completed chapters in a course' })
  @ApiOkResponse({ type: [CompletedChapterDto] })
  @ApiForbiddenResponse({ description: 'Missing access to this course' })
  @ApiNotFoundResponse({ description: 'Course not found' })
  async list(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: User,
  ): Promise<CompletedChapterDto[]> {
    const course = await this.coursesService.findOne(courseId);

    if (!user.admin) {
      await this.coursesService.assertAccessible(
        course.id,
        user.groups.map((group) => group.id),
      );

      return this.completedChaptersService.findForUser(user.id, course.id);
    } else {
      return this.completedChaptersService.findAll(course.id);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Mark a chapter as completed for the current user' })
  @ApiCreatedResponse({ type: CompletedChapterDto })
  @ApiBadRequestResponse({
    description: 'Invalid body or chapter does not exist',
  })
  @ApiForbiddenResponse({ description: 'Missing access to this course' })
  @ApiNotFoundResponse({
    description: 'Course not found, or chapter does not belong to the course',
  })
  @ApiConflictResponse({ description: 'Chapter already marked as completed' })
  async complete(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: CompleteChapterDto,
    @CurrentUser() user: User,
  ): Promise<CompletedChapterDto> {
    const course = await this.coursesService.findOne(courseId);

    if (!user.admin) {
      await this.coursesService.assertAccessible(
        course.id,
        user.groups.map((group) => group.id),
      );
    }

    return this.completedChaptersService.completeChapter(
      user.id,
      course.id,
      body.chapterId,
    );
  }
}
