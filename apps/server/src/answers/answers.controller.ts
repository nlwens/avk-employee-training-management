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
import { AdminOnly } from '@/auth/decorators/admin-only.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AuditLog } from '@/audit-log/decorators/audit-log.decorator';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { CoursesService } from '@/courses/courses.service';
import { QuestionsService } from '@/questions/questions.service';
import { User } from '@/users/entities/user.entity';
import { AnswersService } from './answers.service';
import { AnswerDto } from './dto/answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';

@ApiTags('Answers')
@Auth()
@Serialize(AnswerDto)
@AuditLog('answers.')
@Controller('courses/:courseId/questions/:questionId/answers')
export class AnswersController {
  constructor(
    private readonly answersService: AnswersService,
    private readonly questionsService: QuestionsService,
    private readonly coursesService: CoursesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List answers for a course question' })
  @ApiOkResponse({ type: [AnswerDto] })
  @ApiForbiddenResponse({ description: 'Missing access to this course' })
  @ApiNotFoundResponse({ description: 'Course or question not found' })
  async list(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @CurrentUser() user: User,
  ): Promise<AnswerDto[]> {
    const question = await this.questionsService.findOneForCourse(
      questionId,
      courseId,
    );

    if (!user.admin) {
      await this.coursesService.assertAccessible(
        courseId,
        user.groups.map((group) => group.id),
      );
    }

    return this.answersService.findAllForQuestion(question.id);
  }

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Create a new answer to a course question' })
  @ApiCreatedResponse({ type: AnswerDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiNotFoundResponse({
    description: 'Course or question not found, or question not in course',
  })
  async create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() body: CreateAnswerDto,
  ) {
    const question = await this.questionsService.findOneForCourse(
      questionId,
      courseId,
    );

    return this.answersService.create(body, question.id);
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Updates an existing answer' })
  @ApiOkResponse({ type: AnswerDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiNotFoundResponse({ description: 'Course, question, or answer not found' })
  async update(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAnswerDto,
  ): Promise<AnswerDto> {
    // First, attempt to get the question for the specific course. This also
    // checks that the question belongs to the course.
    const question = await this.questionsService.findOneForCourse(
      questionId,
      courseId,
    );

    // Now do the same for the answer, checking that it belongs to the question.
    const answer = await this.answersService.findOneForQuestion(
      id,
      question.id,
    );

    return this.answersService.update(body, answer);
  }

  @Delete(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletes an answer from a course question' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({
    description:
      'Course, question, or answer not found, or answer does not belong to the question',
  })
  async delete(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    // First, attempt to get the question for the specific course. This also
    // checks that the question belongs to the course.
    const question = await this.questionsService.findOneForCourse(
      questionId,
      courseId,
    );

    // Now do the same for the answer, checking that it belongs to the question.
    const answer = await this.answersService.findOneForQuestion(
      id,
      question.id,
    );

    await this.answersService.delete(answer);
  }
}
