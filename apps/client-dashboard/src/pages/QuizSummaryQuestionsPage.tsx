import React, { useState } from "react";
import { Table, TableBody, TableCell, TableRow } from "@ui/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ui/components/ui/accordion";
import { Card, CardContent } from "@ui/components/ui/card";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  questionsQueryOptions,
  userAnswersQueryOptions,
  usersQueryOptions,
  QueryBoundary,
  useQueryClient,
  useSuspenseQuery,
  useSuspenseQueries,
  type Question,
} from "@api/src";
import QuizAnswerOptions from "../components/quizzes/QuizAnswerOptions";
import { CircleCheckBig, XIcon } from "lucide-react";

const getOptionLabel = (index: number) => String.fromCharCode(65 + index);

interface QuestionAnswersContentProps {
  courseId: string;
  question: Question;
}

const QuestionAnswersContent: React.FC<QuestionAnswersContentProps> = ({
  courseId,
  question,
}) => {
  const { t } = useTranslation(["quiz"]);

  const [{ data: userAnswers }, { data: users }] = useSuspenseQueries({
    queries: [
      userAnswersQueryOptions(courseId, question.id),
      usersQueryOptions(),
    ],
  });

  if (userAnswers.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">
        {t(($) => $.quiz.summary.no_answers)}
      </p>
    );
  }

  const correctCount = userAnswers.filter(
    (answer) => answer.answerId === question.correctAnswerId,
  ).length;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">
        {t(($) => $.quiz.summary.correct_answers, {
          value: `${correctCount}/${userAnswers.length}`,
          interpolation: { escapeValue: false },
        })}
      </p>

      <Table>
        <TableBody>
          {userAnswers.map((answer) => {
            const user = users.find((u) => u.id === answer.userId);
            const answerIndex = question.answers.findIndex(
              (a) => a.id === answer.answerId,
            );
            const isCorrect = answer.answerId === question.correctAnswerId;

            return (
              <TableRow key={answer.userId}>
                <TableCell>
                  {user ? `${user.name} ${user.surname}` : answer.userId}
                </TableCell>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    {answerIndex >= 0 ? getOptionLabel(answerIndex) : "-"}
                    {isCorrect ? (
                      <CircleCheckBig
                        size={18}
                        className="block text-green-500"
                      />
                    ) : (
                      <XIcon size={18} className="block text-red-500" />
                    )}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

interface QuestionAnswersProps extends QuestionAnswersContentProps {
  number: number;
}

const QuestionAnswers: React.FC<QuestionAnswersProps> = ({
  courseId,
  question,
  number,
}) => {
  const { t } = useTranslation(["quiz", "errors"]);
  const queryClient = useQueryClient();
  const [opened, setOpened] = useState(false);

  const prefetch = () => {
    void queryClient.prefetchQuery(
      userAnswersQueryOptions(courseId, question.id),
    );
    void queryClient.prefetchQuery(usersQueryOptions());
  };

  return (
    <Card className="rounded-md border">
      <CardContent className="p-4">
        <QuizAnswerOptions number={number} question={question} />

        <Accordion
          type="single"
          collapsible
          className="mt-4"
          onValueChange={(value) => {
            if (value) setOpened(true);
          }}
        >
          <AccordionItem value={`question-${question.id}`} className="border-0">
            <AccordionTrigger
              className="font-body text-sm cursor-pointer"
              onMouseEnter={prefetch}
              onFocus={prefetch}
            >
              {t(($) => $.quiz.summary.view_answers)}
            </AccordionTrigger>

            <AccordionContent>
              {opened && (
                <QueryBoundary
                  errorMessage={t(
                    ($) => $.quiz.summary.messages.error.loading_answers,
                  )}
                >
                  <QuestionAnswersContent
                    courseId={courseId}
                    question={question}
                  />
                </QueryBoundary>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

const QuizSummaryQuestionsContent: React.FC<{ courseId: string }> = ({
  courseId,
}) => {
  const { t } = useTranslation(["quiz"]);

  const { data: questions } = useSuspenseQuery(questionsQueryOptions(courseId));

  if (questions.length === 0) {
    return (
      <p className="py-20 text-center text-gray-500">
        {t(($) => $.quiz.summary.no_questions)}
      </p>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      {questions.map((q, i) => (
        <QuestionAnswers
          key={q.id}
          courseId={courseId}
          question={q}
          number={i + 1}
        />
      ))}
    </div>
  );
};

const QuizSummaryQuestionsPage: React.FC = () => {
  const { courseId } = useParams() as { courseId: string };

  const { t } = useTranslation(["quiz", "errors"]);

  return (
    <QueryBoundary
      errorMessage={t(($) => $.quiz.summary.messages.error.loading)}
    >
      <QuizSummaryQuestionsContent courseId={courseId} />
    </QueryBoundary>
  );
};

export default QuizSummaryQuestionsPage;
