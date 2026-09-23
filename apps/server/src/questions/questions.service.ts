import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Answer } from '@/answers/entities/answer.entity';
import { ErrorCode } from '@/common/enums/error-codes.enum';
import { type LocaleCode } from '@/locales/locales';
import { Question } from './entities/question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionTranslation } from './entities/question-translation.entity';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuestionTranslation)
    private readonly translationRepository: Repository<QuestionTranslation>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
  ) {}

  findOne(id: string): Promise<Question> {
    return this.questionRepository.findOneByOrFail({ id });
  }

  findOneForCourse(id: string, courseId: string): Promise<Question> {
    return this.questionRepository.findOneOrFail({
      where: { id, courseId },
      relations: { answers: true },
    });
  }

  findAllForCourse(courseId: string): Promise<Question[]> {
    return this.questionRepository.find({
      where: { courseId },
      relations: { answers: true },
      order: { order: 'ASC' },
    });
  }

  buildExplanation(question: Question): Record<LocaleCode, string | null> {
    return Object.fromEntries(
      question.translations.map(({ localeCode, explanation }) => [
        localeCode,
        explanation,
      ]),
    ) as Record<LocaleCode, string | null>;
  }

  async create(dto: CreateQuestionDto, courseId: string): Promise<Question> {
    const question = await this.questionRepository.save(
      this.questionRepository.create({ courseId, order: dto.order }),
    );

    question.translations = await this.translationRepository.save(
      dto.translations.map(({ locale, text, explanation }) =>
        this.translationRepository.create({
          questionId: question.id,
          localeCode: locale,
          text,
          explanation,
        }),
      ),
    );

    // Only initiate the array so that it is a part of the response.
    question.answers = [];

    return question;
  }

  async update(body: UpdateQuestionDto, question: Question): Promise<Question> {
    if (body.order !== undefined) {
      question.order = body.order;
    }

    if (body.correctAnswerId !== undefined) {
      const answerBelongsToQuestion = await this.answerRepository.existsBy({
        id: body.correctAnswerId,
        questionId: question.id,
      });

      if (!answerBelongsToQuestion) {
        throw new BadRequestException({
          message: 'The correct answer does not belong to this question',
          code: ErrorCode.CORRECT_ANSWER_NOT_FOR_QUESTION,
        });
      }

      question.correctAnswerId = body.correctAnswerId;
    }

    if (body.translations !== undefined) {
      for (const translation of body.translations) {
        await this.translationRepository.upsert(
          {
            questionId: question.id,
            localeCode: translation.locale,
            text: translation.text,
            explanation: translation.explanation,
          },
          ['questionId', 'localeCode'],
        );
      }

      question.translations = await this.translationRepository.find({
        where: { questionId: question.id },
        order: { localeCode: 'ASC' },
      });
    }

    return this.questionRepository.save(question);
  }

  async delete(question: Question): Promise<void> {
    await this.questionRepository.delete({
      id: question.id,
      courseId: question.courseId,
    });
  }
}
