import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChaptersService } from '@/chapters/chapters.service';
import { CompletedChapter } from './entities/completed-chapter.entity';
import { ErrorCode } from '@/common/enums/error-codes.enum';

@Injectable()
export class CompletedChaptersService {
  constructor(
    @InjectRepository(CompletedChapter)
    private readonly completedChapterRepository: Repository<CompletedChapter>,
    private readonly chaptersService: ChaptersService,
  ) {}

  findAll(courseId: string): Promise<CompletedChapter[]> {
    return this.completedChapterRepository.find({
      where: { chapter: { courseId } },
    });
  }

  findForUser(userId: string, courseId: string): Promise<CompletedChapter[]> {
    return this.completedChapterRepository.find({
      where: { userId, chapter: { courseId } },
    });
  }

  async completeChapter(
    userId: string,
    courseId: string,
    chapterId: string,
  ): Promise<CompletedChapter> {
    const chapter = await this.chaptersService.findOne(chapterId);

    if (chapter.courseId !== courseId) {
      throw new BadRequestException({
        message: 'The chapter does not belong to this course',
        code: ErrorCode.CHAPTER_NOT_FOR_COURSE,
      });
    }

    if (await this.completedChapterRepository.existsBy({ userId, chapterId })) {
      throw new ConflictException('Chapter already completed');
    }

    return this.completedChapterRepository.save(
      this.completedChapterRepository.create({ userId, chapterId }),
    );
  }
}
