import { useNavigate } from "react-router-dom";
import type { SubmitHandler } from "react-hook-form";
import type { QuizFormValues } from "@ui/components/forms/validators";
import QuizForm from "../components/quizzes/QuizForm";

const CreateQuizPage = () => {
  const navigate = useNavigate();

  const handleSave: SubmitHandler<QuizFormValues> = (values) => {
    // TODO: save to backend
    console.log("values:", values);
  };

  return (
    <QuizForm onSubmit={handleSave} onCancel={() => navigate("/courses")} />
  );
};

export default CreateQuizPage;
