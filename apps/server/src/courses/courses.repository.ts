import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DataSource,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { CompletedChapter } from '@/completed-chapters/entities/completed-chapter.entity';
import { UserAnswer } from '@/answers/entities/user-answer.entity';
import { Chapter } from '@/chapters/entities/chapter.entity';
import { Question } from '@/questions/entities/question.entity';
import { Course } from './entities/course.entity';
import { CourseStatsDto } from './dto/course-stats.dto';

interface CourseProgressQuery {
  /** User whose progress drives per-user statistics, ranking and filtering. */
  userId: string | undefined;

  /**
   * When set, narrows the result to the user's in-progress (`false`) or fully
   * completed (`true`) courses. When undefined, no progress filter is applied.
   */
  finished?: boolean;

  page: number;
  limit: number;
}

interface ListCoursesOptions extends CourseProgressQuery {
  /** Term matched against translated titles and content across all locales. */
  search?: string;
}

interface ListAllCoursesOptions extends ListCoursesOptions {
  /** Filter on publication state. Omit to include every course. */
  published?: boolean;
}

interface ListCoursesForGroupsOptions extends ListCoursesOptions {
  /** Groups the user belongs to. A public course (no group) is always visible. */
  groupIds: string[];
}

interface FindOrderedByProgressOptions extends CourseProgressQuery {
  where: FindOptionsWhere<Course>[];
}

/**
 * Course data access that goes beyond plain `find` calls: per-user progress
 * ranking, the search/visibility `where` assembly, the finished filter, and the
 * post-query statistics that virtual columns cannot express because they depend
 * on a runtime variable.
 *
 * It extends the base repository so CoursesService depends on a single course
 * repository and inherits the usual CRUD methods, while this class adds the
 * progress-aware reads. That keeps the service focused on business logic.
 */
@Injectable()
export class CoursesRepository extends Repository<Course> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Course, dataSource.createEntityManager());
  }

  findAll({
    userId,
    search,
    published,
    finished,
    page,
    limit,
  }: ListAllCoursesOptions): Promise<[Course[], number]> {
    const baseWhere = published !== undefined ? { published } : {};

    return this.findOrderedByProgress({
      where: this.buildSearchWhere(search, baseWhere),
      userId,
      finished,
      page,
      limit,
    });
  }

  findForGroups({
    groupIds,
    userId,
    search,
    finished,
    page,
    limit,
  }: ListCoursesForGroupsOptions): Promise<[Course[], number]> {
    // A published course is visible when it is public (assigned to no group) or
    // assigned to one of the user's groups. These are separate group filters
    // because find() ORs the elements of a where array.
    const groupFilters: FindOptionsWhere<Course>['groups'][] =
      groupIds.length > 0
        ? [{ id: IsNull() }, { id: In(groupIds) }]
        : [{ id: IsNull() }];

    // Combine each group filter with the search conditions. buildSearchWhere
    // may itself return multiple conditions (title/content), so we flatten the
    // result into the final list of OR conditions.
    const where = groupFilters.flatMap((groupFilter) =>
      this.buildSearchWhere(search, {
        published: true,
        groups: groupFilter,
      }),
    );

    return this.findOrderedByProgress({ where, userId, finished, page, limit });
  }

  isAccessibleToGroups(
    courseId: string,
    userGroupIds: string[],
  ): Promise<boolean> {
    const builder = this.createQueryBuilder('course')
      .leftJoin('course.groups', 'group')
      .where('course.id = :courseId', { courseId })
      .andWhere('course.published = :published', { published: true });

    if (userGroupIds.length > 0) {
      builder.andWhere('(group.id IS NULL OR group.id IN (:...groups))', {
        groups: userGroupIds,
      });
    } else {
      builder.andWhere('group.id IS NULL');
    }

    return builder.getExists();
  }

  /**
   * Calculate and retrieve statistics for a course.
   *
   * The average score only includes users who answered every course question.
   */
  async getStats(courseId: string) {
    const { questionsCount } = await this.findOneOrFail({
      where: { id: courseId },
      select: ['id', 'questionsCount'],
    });

    if (questionsCount === 0) {
      return { averageScore: 0 };
    }

    // Average the per-user scores in the database instead of fetching every row
    // and reducing in runtime: wrap the per-user query as a derived table and
    // take its average. With no completions, the derived table is empty and
    // returns NULL.
    const scores = this.completedQuizScoresQuery(courseId, questionsCount);

    const result = await this.manager
      .createQueryBuilder()
      .select('AVG(scores.score)', 'average')
      .from(`(${scores.getQuery()})`, 'scores')
      .setParameters(scores.getParameters())
      .getRawOne<{ average: string | null }>();

    const average = result?.average ?? null;

    return {
      averageScore: Math.round((Number(average) / questionsCount) * 100),
    } satisfies CourseStatsDto;
  }

  /**
   * Return a list of users who completed the quiz with their score.
   *
   * Mirrors `getStats`: only users who answered all questions are included, so
   * the score is always out of the full `questionsCount`. The submission date
   * is the latest answer the user submitted for this course.
   */
  async getQuizResults(courseId: string) {
    const course = await this.findOneOrFail({
      where: { id: courseId },
      select: ['id', 'questionsCount'],
    });

    if (course.questionsCount === 0) {
      return [];
    }

    return this.completedQuizScoresQuery(
      course.id,
      course.questionsCount,
    ).getRawMany<{
      userId: string;
      score: unknown;
      submittedAt: Date;
    }>();
  }

  /**
   * Query for the per-user scores of the users who completed the course.
   *
   * Shared by `getStats` (which averages it) and `getQuizResults` (which
   * returns the rows): `score` is the number of correctly answered questions
   * and `submittedAt` is the user's latest answer for the course.
   *
   * @return A query builder that callers can execute or wrap.
   */
  private completedQuizScoresQuery(courseId: string, questionsCount: number) {
    return this.manager
      .getRepository(UserAnswer)
      .createQueryBuilder('ua')
      .select('ua.user_id', 'userId')
      .addSelect('MAX(ua.created_at)', 'submittedAt')
      .addSelect(
        'SUM(CASE WHEN ua.answer_id = question.correct_answer_id THEN 1 ELSE 0 END)',
        'score',
      )
      .innerJoin(Question, 'question', 'question.id = ua.question_id')
      .where('question.course_id = :courseId', { courseId })
      .groupBy('ua.user_id')
      .having('COUNT(DISTINCT ua.question_id) = :questions', {
        questions: questionsCount,
      });
  }

  /**
   * Return one page of courses matching `where`, ordered by priority (the
   * highest first), then by how many of the course's chapters the user has
   * completed (least first), then by creation date (the newest first).
   *
   * The number of completed chapters in a course is computed per user rather
   * than stored in the course, so TypeORM's `find` cannot sort by it. The
   * ranking query therefore selects only identifiers; loading the translations
   * too would change how TypeORM paginates and break the sort, so the actual
   * course entities are fetched by the ID in a second query.
   *
   * The total is counted on its own because that paged query only sees one page
   * and cannot say how many courses match overall.
   */
  private async findOrderedByProgress({
    where,
    userId,
    finished,
    page,
    limit,
  }: FindOrderedByProgressOptions): Promise<[Course[], number]> {
    // Total of all matches, independent of the page. The finished filter relies
    // on per-user subqueries that find()'s where cannot express, so the count
    // is built with the query builder whenever it is active.
    const total = await this.applyFinishedFilter(
      this.createQueryBuilder('course')
        .setFindOptions({ where })
        .setParameters({ sortUserId: userId ?? null }),
      finished,
    ).getCount();

    if (total === 0) {
      return [[], 0];
    }

    const rows = await this.applyFinishedFilter(
      this.createQueryBuilder('course')
        .setFindOptions({ where, loadEagerRelations: false })
        .select('course.id', 'id')
        .addSelect('course.priority', 'priority')
        .addSelect('course.created_at', 'createdAt')
        .addSelect(
          (qb: SelectQueryBuilder<Course>) => this.completedChaptersCount(qb),
          'completed',
        )
        // Collapse duplicate rows that the where-clause joins can produce.
        .distinct(true)
        // Set a query parameter for user statistics.
        .setParameters({ sortUserId: userId ?? null }),
      finished,
    )
      .orderBy('course.priority', 'DESC')
      .addOrderBy('completed', 'ASC')
      .addOrderBy('course.created_at', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<{ id: string }>();

    const orderedIds = rows.map((row) => row.id);

    // Reload the page with its translations and per-user statistics.
    const courses = await this.findBy({ id: In(orderedIds) });

    // We have to map the identifiers back to entities to restore the order.
    const coursesById = new Map(courses.map((course) => [course.id, course]));
    const ordered = orderedIds.map((id) => coursesById.get(id)!);

    await this.attachUserStatistics(ordered, userId);

    return [ordered, total];
  }

  /**
   * Build the `where` conditions for a course query, optionally narrowed by a
   * search term. Always returns an array so callers can treat the result
   * uniformly (a single-element array behaves the same as a plain object).
   *
   * Without a search term, the base filter is returned as-is. With a search
   * term it expands into two conditions, since a match on either a
   * translation's title OR content should include the course (find() ORs the
   * elements of a where array, but ANDs the properties within one object).
   */
  private buildSearchWhere(
    search?: string,
    baseWhere: FindOptionsWhere<Course> = {},
  ): FindOptionsWhere<Course>[] {
    const trimmedSearch = search?.trim();

    if (!trimmedSearch) {
      return [baseWhere];
    }

    const searchPattern = `%${trimmedSearch}%`;

    return [
      { ...baseWhere, translations: { title: ILike(searchPattern) } },
      { ...baseWhere, translations: { content: ILike(searchPattern) } },
    ];
  }

  /**
   * Restrict a course query to the user's progress.
   *
   * This does nothing when `finished` is undefined.
   *
   * When `finished` equals to `false`, only courses the user has started (at
   * least one completed chapter) are included.
   *
   * When `finished` equals to `true`, only courses the user has fully completed
   * (every chapter completed and every question answered) are included.
   *
   * The caller must set the `sortUserId` parameter on the builder.
   */
  private applyFinishedFilter<T extends SelectQueryBuilder<Course>>(
    builder: T,
    finished?: boolean,
  ): T {
    if (finished === undefined) {
      return builder;
    }

    const completedChapters = this.completedChaptersCount(builder).getQuery();
    const chapters = this.chaptersCount(builder).getQuery();

    const answeredQuestions = this.answeredQuestionsCount(builder).getQuery();
    const questions = this.questionsCount(builder).getQuery();

    if (finished) {
      builder
        .andWhere(`${completedChapters} = ${chapters}`)
        .andWhere(`${answeredQuestions} = ${questions}`);
    } else {
      // Started (at least one completed chapter) but not yet finished, i.e., a
      // different number of answered questions than the course has.
      builder
        .andWhere(`${completedChapters} > 0`)
        .andWhere(`${answeredQuestions} <> ${questions}`);
    }

    return builder;
  }

  private completedChaptersCount(
    qb: SelectQueryBuilder<Course>,
  ): SelectQueryBuilder<CompletedChapter> {
    return qb
      .subQuery()
      .select('COUNT(*)')
      .from(CompletedChapter, 'cc')
      .innerJoin('cc.chapter', 'ch')
      .where('ch.courseId = course.id')
      .andWhere('cc.userId = :sortUserId');
  }

  private chaptersCount(
    qb: SelectQueryBuilder<Course>,
  ): SelectQueryBuilder<Chapter> {
    return qb
      .subQuery()
      .select('COUNT(*)')
      .from(Chapter, 'ch')
      .where('ch.courseId = course.id');
  }

  private answeredQuestionsCount(
    qb: SelectQueryBuilder<Course>,
  ): SelectQueryBuilder<UserAnswer> {
    return qb
      .subQuery()
      .select('COUNT(DISTINCT ua.questionId)')
      .from(UserAnswer, 'ua')
      .innerJoin('ua.question', 'q')
      .where('q.courseId = course.id')
      .andWhere('ua.userId = :sortUserId');
  }

  private questionsCount(
    qb: SelectQueryBuilder<Course>,
  ): SelectQueryBuilder<Question> {
    return qb
      .subQuery()
      .select('COUNT(*)')
      .from(Question, 'q')
      .where('q.courseId = course.id');
  }

  async attachUserStatistics(
    courses: Course[],
    userId?: string,
  ): Promise<Course[]> {
    await Promise.all([
      this.withCompletedChaptersCount(courses, userId),
      this.withCorrectAnswersCount(courses, userId),
    ]);

    // Entities are modified by a reference; we can return the original array.
    return courses;
  }

  /**
   * Calculate `correctAnswersCount` for each course entity after the main query
   * has already loaded them.
   *
   * Follows the same post-processing pattern as `withCompletedChaptersCount`
   * for the same reasons (`@VirtualColumn` cannot accept a runtime parameter).
   */
  private async withCorrectAnswersCount(
    courses: Course[],
    userId?: string,
  ): Promise<Course[]> {
    if (!userId || courses.length === 0) {
      return courses;
    }

    const ids = courses.map((course) => course.id);

    const rows: { courseId: string; count: unknown }[] = await this.manager
      .getRepository(UserAnswer)
      .createQueryBuilder('ua')
      .select('question.course_id', 'courseId')
      .addSelect('COUNT(*)', 'count')
      .innerJoin(Question, 'question', 'question.id = ua.question_id')
      .where('ua.user_id = :userId', { userId })
      .andWhere('question.course_id IN (:...courseIds)', { courseIds: ids })
      .andWhere('ua.answer_id = question.correct_answer_id')
      .groupBy('question.course_id')
      .getRawMany();

    // Construct a map for lookup of correctly answered questions by course ID.
    const countByCourseId = Object.fromEntries(
      rows.map((row) => [row.courseId, Number(row.count)]),
    );

    for (const course of courses) {
      course.correctAnswersCount = countByCourseId[course.id] ?? 0;
    }

    return courses;
  }

  /**
   * Calculate `completedChaptersCount` for each course entity after the main
   * query has already loaded them.
   *
   * Why a post-processing step? TypeORM offers two mechanisms that could
   * theoretically carry this number but do not work in our case:
   *
   * `@VirtualColumn` embeds a subquery directly in the generated query. It
   * works with every `find*` call and is how `chaptersCount` is populated.
   * However, it cannot be used for `completedChaptersCount` because
   * `@VirtualColumn` receives only the table alias; there is no mechanism to
   * inject a dynamic runtime parameter such as `userId` into its subquery.
   *
   * `loadRelationCountAndMap` accepts a factory callback that can add runtime
   * conditions (e.g., filter by `userId`). However, it is only available
   * through QueryBuilder. Using QueryBuilder bypasses TypeORM's eager-relation
   * loading, meaning `translations` would not be included unless explicitly
   * joined every time.
   */
  private async withCompletedChaptersCount(
    courses: Course[],
    userId?: string,
  ): Promise<Course[]> {
    if (!userId || courses.length === 0) {
      return courses;
    }

    const ids = courses.map((course) => course.id);

    // Calculate completed chapter counts for each course.
    const rows: { courseId: string; count: unknown }[] = await this.manager
      .getRepository(CompletedChapter)
      .createQueryBuilder('cc')
      .select('chapter.course_id', 'courseId')
      .addSelect('count(*)', 'count')
      .innerJoin(Chapter, 'chapter', 'chapter.id = cc.chapter_id')
      .where('cc.user_id = :userId', { userId })
      .andWhere('chapter.course_id IN (:...courseIds)', { courseIds: ids })
      .groupBy('chapter.course_id')
      .getRawMany();

    // Construct a map for lookup of completed chapter counts by course ID.
    const countByCourseId = Object.fromEntries(
      rows.map((row) => [row.courseId, Number(row.count)]),
    );

    for (const course of courses) {
      course.completedChaptersCount = countByCourseId[course.id] ?? 0;
    }

    return courses;
  }
}
