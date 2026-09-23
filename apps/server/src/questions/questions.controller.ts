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
import { CoursesService } from '@/courses/courses.service';
import { User } from '@/users/entities/user.entity';
import { AdminOnly } from '@/auth/decorators/admin-only.decorator';
import { AuditLog } from '@/audit-log/decorators/audit-log.decorator';
import { QuestionDto } from './dto/question.dto';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@ApiTags('Questions')
@Auth()
@Serialize(QuestionDto)
@AuditLog('questions.')
@Controller('courses/:courseId/questions')
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly coursesService: CoursesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List quiz questions with answer options for a course',
  })
  @ApiOkResponse({ type: [QuestionDto] })
  @ApiNotFoundResponse({ description: 'Course not found' })
  @ApiForbiddenResponse({ description: 'Missing access to this course' })
  async list(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: User,
  ): Promise<QuestionDto[]> {
    const course = await this.coursesService.findOne(courseId);

    if (!user.admin) {
      await this.coursesService.assertAccessible(
        course.id,
        user.groups.map((group) => group.id),
      );
    }

    return this.questionsService.findAllForCourse(course.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single quiz question with answer options' })
  @ApiOkResponse({ type: QuestionDto })
  @ApiForbiddenResponse({ description: 'Missing access to this course' })
  @ApiNotFoundResponse({ description: 'Course or question not found' })
  async get(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<QuestionDto> {
    const question = await this.questionsService.findOneForCourse(id, courseId);

    if (!user.admin) {
      await this.coursesService.assertAccessible(
        courseId,
        user.groups.map((group) => group.id),
      );
    }

    return question;
  }

  @Post()
  @AdminOnly()
  @ApiOperation({
    summary: 'Creates a new quiz question for a course',
  })
  @ApiCreatedResponse({ type: [QuestionDto] })
  @ApiNotFoundResponse({ description: 'Course not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  async create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: CreateQuestionDto,
  ): Promise<QuestionDto> {
    const course = await this.coursesService.findOne(courseId);
    return await this.questionsService.create(body, course.id);
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Updates an existing quiz question' })
  @ApiOkResponse({ type: QuestionDto })
  @ApiBadRequestResponse({
    description:
      'Invalid request body or the answer does not belong to the question',
  })
  @ApiNotFoundResponse({ description: 'Course or question not found' })
  async update(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateQuestionDto,
  ): Promise<QuestionDto> {
    const question = await this.questionsService.findOneForCourse(id, courseId);
    return this.questionsService.update(body, question);
  }

  @Delete(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletes quiz question for a course',
  })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({
    description:
      'Course or question is not found, or question does not belong to the course',
  })
  async delete(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const question = await this.questionsService.findOneForCourse(id, courseId);
    await this.questionsService.delete(question);
  }
}
