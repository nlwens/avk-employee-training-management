import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient, useSuspenseQueries } from "@tanstack/react-query";
import {
  questionsQueryOptions,
  QueryBoundary,
  useHandleApiError,
  courseQueryOptions,
  coursesListQueryKey,
  type ApiError,
} from "api/src";
import ToastAndNavigate from "ui/components/ToastAndNavigate";
import CourseNavbar from "../components/courses/CourseNavbar";
import CoursePageContent from "../components/courses/CoursePageContent";
import QuizStepper from "../components/quizzes/QuizStepper";
import { useUserAnswers } from "../hooks/queries/useUserAnswers";
import { useSubmitAnswer } from "../hooks/mutations/useSubmitAnswer";

interface CourseQuizProps {
  courseId: string;
}

const CourseQuiz: React.FC<CourseQuizProps> = ({ courseId }) => {
  const navigate = useNavigate();

  const { t } = useTranslation(["courses", "errors"]);

  const { handleApiError } = useHandleApiError();
  const { mutate: submitAnswer, isPending } = useSubmitAnswer();

  const [{ data: questions }] = useSuspenseQueries({
    queries: [questionsQueryOptions(courseId)],
  });

  const { data: userAnswers } = useUserAnswers(courseId, questions);

  // Always open at the first question. Already-answered questions are still
  // shown so the user can step through the whole quiz from the start, whether
  // they are taking it or just reviewing it.
  const [step, setStep] = useState(0);

  if (!questions.length) {
    return (
      <ToastAndNavigate
        message={t(($) => $.errors.resource_not_found)}
        to={`/courses/${courseId}`}
      />
    );
  }

  const handleSubmitAnswer = (questionId: string, answerId: string): void => {
    submitAnswer(
      { courseId, questionId, answerId },
      { onError: (error: ApiError) => handleApiError(error) },
    );
  };

  return (
    <QuizStepper
      key={step}
      currentStep={step}
      onGoToStep={setStep}
      questions={questions}
      onComplete={() => navigate(`/courses/${courseId}/completed`)}
      onSubmitAnswer={handleSubmitAnswer}
      userAnswer={userAnswers[step][0]}
      isPending={isPending}
    />
  );
};

const CourseQuizPage: React.FC = () => {
  const { courseId } = useParams() as { courseId: string };

  const { t } = useTranslation(["courses"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <div className="flex h-full flex-col">
      <CourseNavbar />
      <CoursePageContent className="flex flex-1 flex-col">
        <QueryBoundary
          onNotFound={() => {
            void queryClient.invalidateQueries({
              queryKey: coursesListQueryKey,
            });

            queryClient.removeQueries(courseQueryOptions(courseId));

            navigate(`/courses/${courseId}`, { replace: true });
          }}
          messages={{ notFound: t(($) => $.courses.messages.error.not_found) }}
          errorMessage={t(($) => $.courses.messages.error.loading)}
        >
          <CourseQuiz courseId={courseId} />
        </QueryBoundary>
      </CoursePageContent>
    </div>
  );
};

export default CourseQuizPage;
