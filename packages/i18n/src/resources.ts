import type { Resource } from "i18next";

import commonEn from "../locales/en/common.json";
import errorsEn from "../locales/en/errors.json";
import navigationEn from "../locales/en/navigation.json";
import authEn from "../locales/en/auth.json";
import coursesEn from "../locales/en/courses.json";
import chaptersEn from "../locales/en/chapters.json";
import quizEn from "../locales/en/quiz.json";
import employeesEn from "../locales/en/employees.json";
import groupsEn from "../locales/en/groups.json";
import validationEn from "../locales/en/validation.json";

import commonNl from "../locales/nl/common.json";
import errorsNl from "../locales/nl/errors.json";
import navigationNl from "../locales/nl/navigation.json";
import authNl from "../locales/nl/auth.json";
import coursesNl from "../locales/nl/courses.json";
import chaptersNl from "../locales/nl/chapters.json";
import quizNl from "../locales/nl/quiz.json";
import employeesNl from "../locales/nl/employees.json";
import groupsNl from "../locales/nl/groups.json";
import validationNl from "../locales/nl/validation.json";

export const defaultNS = "common" as const;

export const resources = {
  en: {
    common: commonEn,
    errors: errorsEn,
    navigation: navigationEn,
    auth: authEn,
    courses: coursesEn,
    chapters: chaptersEn,
    quiz: quizEn,
    employees: employeesEn,
    groups: groupsEn,
    validation: validationEn,
  },
  nl: {
    common: commonNl,
    errors: errorsNl,
    navigation: navigationNl,
    auth: authNl,
    courses: coursesNl,
    chapters: chaptersNl,
    quiz: quizNl,
    employees: employeesNl,
    groups: groupsNl,
    validation: validationNl,
  },
} as const satisfies Resource;
