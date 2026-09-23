import React, { useState } from "react";
import { useLocalize } from "i18n";
import Stepper from "../stepper/Stepper";
import QuizStepFooter from "./QuizStepFooter";
import QuizStepContent from "./QuizStepContent";
import type { Question, UserAnswer } from "@api/src";

interface QuizStepperProps {
  currentStep: number;
  onGoToStep: (nextStep: number) => void;
  questions: Question[];
  onComplete: () => void;
  onSubmitAnswer: (questionId: string, answerId: string) => void;
  userAnswer: UserAnswer | null;
  isPending: boolean;
}

const QuizStepper: React.FC<QuizStepperProps> = ({
  currentStep: step,
  onGoToStep,
  questions,
  onComplete,
  onSubmitAnswer,
  userAnswer,
  isPending,
}) => {
  const { localize } = useLocalize();

  const [selectedOption, setSelectedOption] = useState(
    userAnswer?.answerId ?? null,
  );

  // Whether this question was already answered when the user navigated to it.
  // We use it to warn that the answer is locked only when reviewing a question,
  // never right after the user has just answered it.
  const [wasAnsweredOnEntry] = useState(!!userAnswer);

  const handleAction = () => {
    if (userAnswer) {
      if (step === questions.length - 1) {
        onComplete();
      } else {
        onGoToStep(step + 1);
      }
    } else if (selectedOption) {
      onSubmitAnswer(questions[step].id, selectedOption);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full gap-6 h-full min-h-0 pb-24">
      <section className="w-full py-3">
        <Stepper steps={questions} current={step} />
      </section>

      <QuizStepContent
        questionText={localize(questions[step].translations, "text")}
        options={questions[step].answers}
        selectedOption={selectedOption}
        onOptionSelect={setSelectedOption}
        submissionResult={userAnswer}
        locked={wasAnsweredOnEntry}
      />

      <QuizStepFooter
        totalSteps={questions.length}
        step={step}
        isOptionSelected={!!selectedOption}
        isAnswered={!!userAnswer}
        isPending={isPending}
        onAction={handleAction}
        onBack={() => onGoToStep(step - 1)}
      />
    </div>
  );
};

export default QuizStepper;
