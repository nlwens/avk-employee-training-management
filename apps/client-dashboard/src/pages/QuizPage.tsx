import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import Tabs from "../components/tabs/Tabs";

const QuizPage = () => {
  const { t } = useTranslation("quiz");

  return (
    <div className="space-y-6">
      <Tabs
        items={[
          { to: "summary", label: t(($) => $.quiz.summary.title) },
          { to: "questions", label: t(($) => $.quiz.summary.questions_tab) },
        ]}
      />

      <Outlet />
    </div>
  );
};

export default QuizPage;
