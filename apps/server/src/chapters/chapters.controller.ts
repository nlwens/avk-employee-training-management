import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { User } from '@/users/entities/user.entity';
import { CoursesService } from '@/courses/courses.service';
import { AdminOnly } from '@/auth/decorators/admin-only.decorator';
import { AuditLog } from '@/audit-log/decorators/audit-log.decorator';
import { ChaptersService } from './chapters.service';
import { ChapterDto } from './dto/chapter.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@ApiTags('Chapters')
@Auth()
@Serialize(ChapterDto)
@AuditLog('chapters.')
@Controller('courses/:courseId/chapters')
export class ChaptersController {
  constructor(
    private readonly chaptersService: ChaptersService,
    private readonly coursesService: CoursesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List chapters for a course' })
  @ApiOkResponse({ type: [ChapterDto] })
  @ApiNotFoundResponse({ description: 'Course not found' })
  @ApiForbiddenResponse({ description: 'Missing access to this course' })
  async list(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: User,
  ): Promise<ChapterDto[]> {
    const course = await this.coursesService.findOne(courseId);

    if (!user.admin) {
      await this.coursesService.assertAccessible(
        course.id,
        user.groups.map((group) => group.id),
      );
    }

    return this.chaptersService.findAllForCourse(course.id);
  }

  @Get(':chapterId')
  @ApiOperation({ summary: 'Chapter details for a course' })
  @ApiOkResponse({ type: ChapterDto })
  @ApiNotFoundResponse({
    description:
      'Course or chapter not found, or chapter does not belong to the course ',
  })
  @ApiForbiddenResponse({ description: 'Missing access to this course' })
  async details(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('chapterId', ParseUUIDPipe) chapterId: string,
    @CurrentUser() user: User,
  ): Promise<ChapterDto> {
    const course = await this.coursesService.findOne(courseId);

    if (!user.admin) {
      await this.coursesService.assertAccessible(
        course.id,
        user.groups.map((group) => group.id),
      );
    }

    return this.chaptersService.findOneForCourse(chapterId, courseId);
  }

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Create a new chapter' })
  @ApiCreatedResponse({ type: ChapterDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  async create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: CreateChapterDto,
  ): Promise<ChapterDto> {
    const course = await this.coursesService.findOne(courseId);
    return this.chaptersService.create(body, course.id);
  }

  @Patch(':chapterId')
  @AdminOnly()
  @ApiOperation({ summary: 'Updates an existing chapter' })
  @ApiOkResponse({ type: ChapterDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiNotFoundResponse({
    description:
      'Course not found, chapter not found, or chapter does not belong to the course',
  })
  async update(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('chapterId', ParseUUIDPipe) chapterId: string,
    @Body() body: UpdateChapterDto,
  ): Promise<ChapterDto> {
    const course = await this.coursesService.findOne(courseId);
    const chapter = await this.chaptersService.findOne(chapterId);

    if (chapter.courseId !== course.id) {
      throw new NotFoundException();
    }

    return this.chaptersService.update(body, chapter);
  }

  @Delete(':chapterId')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a chapter' })
  @ApiNoContentResponse({ description: 'Chapter deleted successfully' })
  @ApiNotFoundResponse({
    description:
      'Course or chapter not found, or chapter does not belong to the course',
  })
  async delete(
    @Param('chapterId', ParseUUIDPipe) chapterId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<void> {
    const chapter = await this.chaptersService.findOneForCourse(
      chapterId,
      courseId,
    );

    await this.chaptersService.delete(chapter.id);
  }
}
