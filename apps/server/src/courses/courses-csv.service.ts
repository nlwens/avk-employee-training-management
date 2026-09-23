import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import {
  DEFAULT_LOCALE,
  DUTCH_LOCALE,
  type LocaleCode,
} from '@/locales/locales';
import { User } from '@/users/entities/user.entity';
import { CoursesService } from './courses.service';
import { Course } from './entities/course.entity';

const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

@Injectable()
export class CoursesCsvService {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly i18n: I18nService,
  ) {}

  async buildCourseScoresDownload(
    user: User,
    locale: LocaleCode,
  ): Promise<{ csv: string; filename: string }> {
    // Export must include every accessible course; pagination defaults are too
    // small, so we pass the largest safe integer as the page size.
    const [courses] = await this.coursesService.findAllForGroups(
      user.groups.map((group) => group.id),
      user.id,
      undefined,
      undefined,
      1,
      Number.MAX_SAFE_INTEGER,
    );

    const headers = [
      'course_name',
      'completed_chapters',
      'total_chapters',
      'correct_answers',
      'total_questions',
    ].map((key) =>
      this.i18n.t(`course-stats.columns.${key}`, { lang: locale }),
    );

    const rows = courses.map((course) => [
      this.getLocalizedCourseTitle(course, locale),
      String(course.completedChaptersCount),
      String(course.chaptersCount),
      String(course.correctAnswersCount),
      String(course.questionsCount),
    ]);

    return {
      csv: this.buildCsvContent(headers, rows),
      filename: this.buildDownloadFilename(user.name, user.surname, new Date()),
    };
  }

  private getLocalizedCourseTitle(course: Course, locale: LocaleCode): string {
    const { translations } = course;

    if (translations.length === 0) {
      return '';
    }

    const localized =
      translations.find((translation) => translation.localeCode === locale) ??
      translations.find(
        (translation) => translation.localeCode === DEFAULT_LOCALE,
      ) ??
      translations[0];

    return localized.title;
  }

  buildDownloadFilename(name: string, surname: string, date: Date): string {
    const fullName = `${name} ${surname}`
      .trim()
      .replace(INVALID_FILENAME_CHARS, '');

    const formattedDate = new Intl.DateTimeFormat(DUTCH_LOCALE, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(date)
      .replace(/\//g, '-');

    return `${fullName} ${formattedDate}.csv`;
  }

  private buildCsvContent(headers: string[], rows: string[][]): string {
    return [headers, ...rows]
      .map((row) => row.map((field) => this.escapeCsvField(field)).join(','))
      .join('\n');
  }

  private escapeCsvField(value: string | number): string {
    const stringValue = String(value);

    if (/[",\n\r]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }
}
