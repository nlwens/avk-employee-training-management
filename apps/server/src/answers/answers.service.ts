import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '@/common/enums/error-codes.enum';
import { AnswerTranslation } from './entities/answer-translation.entity';
import { Answer } from './entities/answer.entity';
import { UserAnswer } from './entities/user-answer.entity';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';

@Injectable()
export class AnswersService {
  constructor(
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    @InjectRepository(AnswerTranslation)
    private readonly translationRepository: Repository<AnswerTranslation>,
    @InjectRepository(UserAnswer)
    private readonly userAnswerRepository: Repository<UserAnswer>,
  ) {}

  findOneForQuestion(id: string, questionId: string): Promise<Answer> {
    return this.answerRepository.findOneOrFail({ where: { id, questionId } });
  }

  findAllForQuestion(questionId: string): Promise<Answer[]> {
    return this.answerRepository.find({ where: { questionId } });
  }

  getUserAnswersForQuestion(
    questionId: string,
    userId?: string,
  ): Promise<UserAnswer[]> {
    return this.userAnswerRepository.find({
      where: userId ? { questionId, userId } : { questionId },
    });
  }

  async submitAnswer(
    userId: string,
    questionId: string,
    answerId: string,
  ): Promise<UserAnswer> {
    const answerBelongsToQuestion = await this.answerRepository.existsBy({
      id: answerId,
      questionId,
    });

    if (!answerBelongsToQuestion) {
      throw new BadRequestException({
        message: 'The answer does not belong to this question',
        code: ErrorCode.ANSWER_NOT_FOR_QUESTION,
      });
    }

    if (await this.userAnswerRepository.existsBy({ userId, questionId })) {
      throw new ConflictException('You have already answered this question');
    }

    return this.userAnswerRepository.save(
      this.userAnswerRepository.create({ userId, questionId, answerId }),
    );
  }

  async deleteUserAnswer(userAnswer: UserAnswer): Promise<void> {
    await this.userAnswerRepository.delete({
      questionId: userAnswer.questionId,
      userId: userAnswer.userId,
    });
  }

  findUserAnswerForQuestion(
    questionId: string,
    userId: string,
  ): Promise<UserAnswer> {
    return this.userAnswerRepository.findOneOrFail({
      where: { questionId, userId },
    });
  }

  async create(body: CreateAnswerDto, questionId: string): Promise<Answer> {
    const answer = this.answerRepository.create({ questionId });
    await this.answerRepository.save(answer);

    answer.translations = await this.translationRepository.save(
      body.translations.map(({ locale, text }) =>
        this.translationRepository.create({
          answerId: answer.id,
          localeCode: locale,
          text,
        }),
      ),
    );

    return answer;
  }

  async update(body: UpdateAnswerDto, answer: Answer): Promise<Answer> {
    if (body.translations !== undefined) {
      for (const translation of body.translations) {
        await this.translationRepository.upsert(
          {
            answerId: answer.id,
            localeCode: translation.locale,
            text: translation.text,
          },
          ['answerId', 'localeCode'],
        );
      }

      answer.translations = await this.translationRepository.find({
        where: { answerId: answer.id },
        order: { localeCode: 'ASC' },
      });
    }

    return answer;
  }

  async delete(answer: Answer): Promise<void> {
    await this.answerRepository.delete({ id: answer.id });
  }
}
