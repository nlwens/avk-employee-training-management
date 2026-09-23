interface ErrorProps {
  message: string | undefined;
}

const Error = ({ message }: ErrorProps) => {
  return <p className="text-center text-sm text-red-500">{message}</p>;
};

export default Error;
