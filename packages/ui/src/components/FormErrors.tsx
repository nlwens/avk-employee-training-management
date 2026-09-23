interface FormErrorsProps {
  messages: string[];
}

const FormErrors = ({ messages }: FormErrorsProps) => {
  if (!messages) {
    return null;
  }

  return (
    <div>
      {messages.map((m, idx) => (
        <p key={idx} className="text-center text-sm text-red-500">
          {m}
        </p>
      ))}
    </div>
  );
};

export default FormErrors;
