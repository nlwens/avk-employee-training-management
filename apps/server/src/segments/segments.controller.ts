import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '@/auth/decorators/auth.decorator';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { CoursesService } from '@/courses/courses.service';
import { ChaptersService } from '@/chapters/chapters.service';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';
import { AdminOnly } from '@/auth/decorators/admin-only.decorator';
import { AuditLog } from '@/audit-log/decorators/audit-log.decorator';
import { SegmentDto } from './dto/segment.dto';
import { SegmentService } from './segments.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from './validators/file-validation-pipe.validator';
import { type LocalizedFiles } from '@/files/files';

@ApiTags('Segments')
@Auth()
@Serialize(SegmentDto)
@AuditLog('segments.')
@Controller('courses/:courseId/chapters/:chapterId/segments')
export class SegmentsController {
  constructor(
    private readonly segmentsService: SegmentService,
    private readonly chaptersService: ChaptersService,
    private readonly coursesService: CoursesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List segments for a course chapter' })
  @ApiOkResponse({ type: [SegmentDto] })
  @ApiNotFoundResponse({
    description:
      'Course not found, chapter not found, or chapter does not belong to the course',
  })
  @ApiForbiddenResponse({ description: 'Missing access to this course' })
  async list(
    @CurrentUser() user: User,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('chapterId', ParseUUIDPipe) chapterId: string,
  ): Promise<SegmentDto[]> {
    const course = await this.coursesService.findOne(courseId);
    const chapter = await this.chaptersService.findOne(chapterId);

    if (chapter.courseId !== course.id) {
      throw new NotFoundException();
    }

    if (!user.admin) {
      await this.coursesService.assertAccessible(
        course.id,
        user.groups.map((group) => group.id),
      );
    }

    return this.segmentsService.findAllForChapter(chapter.id);
  }

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Create a new segment for a chapter' })
  @ApiCreatedResponse({ type: SegmentDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({ type: CreateSegmentDto })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'file_en' }, { name: 'file_nl' }]),
  )
  async create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('chapterId', ParseUUIDPipe) chapterId: string,
    @Body() body: CreateSegmentDto,
    @UploadedFiles(FileValidationPipe)
    files: LocalizedFiles,
  ): Promise<SegmentDto> {
    const chapter = await this.chaptersService.findOneForCourse(
      chapterId,
      courseId,
    );

    return this.segmentsService.create(body, chapter.id, files);
  }

  @Patch(':segmentId')
  @AdminOnly()
  @ApiOperation({ summary: 'Updates an existing segment' })
  @ApiOkResponse({ type: SegmentDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiNotFoundResponse({
    description:
      'Course not found, chapter not found chapter does not belong to the course, or segment is not found',
  })
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({ type: UpdateSegmentDto })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'file_en' }, { name: 'file_nl' }]),
  )
  async update(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('chapterId', ParseUUIDPipe) chapterId: string,
    @Param('segmentId', ParseUUIDPipe) segmentId: string,
    @Body() body: UpdateSegmentDto,
    @UploadedFiles(FileValidationPipe)
    files?: LocalizedFiles,
  ): Promise<SegmentDto> {
    const chapter = await this.chaptersService.findOneForCourse(
      chapterId,
      courseId,
    );

    const segment = await this.segmentsService.findOneForChapter(
      segmentId,
      chapter.id,
    );

    return await this.segmentsService.update(body, segment, files);
  }

  @Delete(':segmentId')
  @AdminOnly()
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a segment linked to a chapter' })
  @ApiNoContentResponse({ description: 'Segment successfully deleted' })
  @ApiNotFoundResponse({
    description:
      'Course not found, chapter not found, segment not found, or chapter does not belong to the course',
  })
  async delete(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('chapterId', ParseUUIDPipe) chapterId: string,
    @Param('segmentId', ParseUUIDPipe) segmentId: string,
  ): Promise<void> {
    const course = await this.coursesService.findOne(courseId);
    const chapter = await this.chaptersService.findOne(chapterId);

    if (chapter.courseId !== course.id) {
      throw new NotFoundException();
    }

    const segment = await this.segmentsService.findOneForChapter(
      segmentId,
      chapter.id,
    );

    await this.segmentsService.delete(segment);
  }
}
