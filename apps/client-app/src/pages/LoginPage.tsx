import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { API, type ApiError } from "api/src";
import { useAuth } from "auth-context/src";
import { LoginForm } from "ui/components/forms/LoginForm";
import { type LoginFormValues } from "@ui/components/forms/validators";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { OfflineFullScreen } from "../components/offline/OfflineFullScreen";

const LoginPage = () => {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { login, isAuthenticated } = useAuth();

  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) =>
      API.post<{ accessToken: string }>("/tokens", {
        email: values.email,
        password: values.password,
      }),

    onError: (error: ApiError) => {
      if (error.statusCode === 401 || error.statusCode === 400) {
        setError("auth:messages.error.invalid_credentials");
        return;
      }

      setError("errors:unexpected");
    },

    onSuccess: (data: { accessToken: string }) => {
      if (!data) return;
      login(data.accessToken);
      navigate("/");
    },
  });

  const onSubmit = (values: LoginFormValues) => loginMutation.mutate(values);

  // If the user is offline, they cannot sign in and use the application.
  if (!isOnline) {
    return <OfflineFullScreen />;
  }

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-white px-6 py-10 sm:px-12">
      <LoginForm
        onSubmit={onSubmit}
        error={error}
        isLoading={loginMutation.isPending}
      />
    </div>
  );
};

export default LoginPage;
