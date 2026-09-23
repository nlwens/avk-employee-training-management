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
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
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
import { Question } from '@/questions/entities/question.entity';
import { User } from '@/users/entities/user.entity';
import { AnswersService } from './answers.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { AnswerSubmissionDto } from './dto/answer-submission.dto';
import { UserAnswerDto } from './dto/user-answer.dto';

@ApiTags('User Answers')
@Auth()
@Controller('courses/:courseId/questions/:questionId/user-answers')
export class UserAnswersController {
  constructor(
    private readonly answersService: AnswersService,
    private readonly coursesService: CoursesService,
    private readonly questionsService: QuestionsService,
  ) {}

  @Get()
  @Serialize(UserAnswerDto)
  @ApiOperation({
    summary: 'Get user answers for a question',
    description:
      'Retrieves user answers for a specific question within a course for the authenticated user. ' +
      'If the user is an administrator, all answers are returned.',
  })
  @ApiOkResponse({ type: [UserAnswerDto] })
  @ApiForbiddenResponse({ description: 'Missing access to this course' })
  @ApiNotFoundResponse({
    description: 'Course or question not found, or question not in course',
  })
  async findAll(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @CurrentUser() user: User,
  ): Promise<UserAnswerDto[]> {
    const question = await this.resolveQuestion(courseId, questionId, user);

    const userAnswers = await this.answersService.getUserAnswersForQuestion(
      questionId,
      !user.admin ? user.id : undefined,
    );

    return userAnswers.map((answer) => ({
      correctAnswerId: question.correctAnswerId,
      answerId: answer.answerId,
      userId: answer.userId,
      explanation: this.questionsService.buildExplanation(question),
      createdAt: answer.createdAt,
    }));
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @Serialize(AnswerSubmissionDto)
  @ApiOperation({ summary: 'Submit an answer to a course question' })
  @ApiOkResponse({ type: AnswerSubmissionDto })
  @ApiBadRequestResponse({
    description: 'Invalid body or answer does not belong to this question',
  })
  @ApiForbiddenResponse({ description: 'Missing access to this course' })
  @ApiNotFoundResponse({
    description: 'Course or question not found, or question not in course',
  })
  @ApiConflictResponse({
    description: 'User has already answered this question',
  })
  async submit(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() data: SubmitAnswerDto,
    @CurrentUser() user: User,
  ): Promise<AnswerSubmissionDto> {
    const question = await this.resolveQuestion(courseId, questionId, user);

    await this.answersService.submitAnswer(user.id, question.id, data.answerId);

    return {
      correctAnswerId: question.correctAnswerId,
      explanation: this.questionsService.buildExplanation(question),
    };
  }

  @Delete(':userId')
  @AdminOnly()
  @AuditLog('user-answers.')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a user's answer for a question",
    description:
      "Deletes the user's answer for a specific question within a course. " +
      'Administrator access is required.',
  })
  @ApiNoContentResponse({ description: 'User answer deleted successfully' })
  @ApiNotFoundResponse({
    description:
      'Course or question not found, question not in course, or no user answer exists',
  })
  async remove(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    const question = await this.resolveQuestion(courseId, questionId, user);

    const userAnswer = await this.answersService.findUserAnswerForQuestion(
      question.id,
      userId,
    );

    await this.answersService.deleteUserAnswer(userAnswer);
  }

  private async resolveQuestion(
    courseId: string,
    questionId: string,
    user: User,
  ): Promise<Question> {
    const course = await this.coursesService.findOne(courseId);
    const question = await this.questionsService.findOne(questionId);

    if (question.courseId !== course.id) {
      throw new NotFoundException();
    }

    if (!user.admin) {
      await this.coursesService.assertAccessible(
        course.id,
        user.groups.map((group) => group.id),
      );
    }

    return question;
  }
}
