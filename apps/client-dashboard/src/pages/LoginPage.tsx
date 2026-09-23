import { useMutation } from "@tanstack/react-query";
import { type LoginFormValues } from "@ui/components/forms/validators";
import { LoginForm } from "@ui/components/forms/LoginForm";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API, type ApiError } from "@api/src";
import { useAuth, decodeToken } from "@auth-context/src";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { t } = useTranslation("auth");

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

      const payload = decodeToken(data.accessToken);
      if (!payload || !payload.admin) {
        setError("auth:messages.error.admin_only");
        return;
      }

      login(data.accessToken);
      navigate("/");
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setError("");
    loginMutation.mutate(values);
  }

  return (
    <main className="flex h-dvh w-full items-center justify-center bg-white px-6 py-10 sm:px-12">
      <LoginForm
        onSubmit={onSubmit}
        error={error}
        isLoading={loginMutation.isPending}
        title={t(($) => $.auth.admin.title)}
        subtitle={t(($) => $.auth.admin.subtitle)}
        submitLabel={t(($) => $.auth.actions.submit)}
        loadingLabel={t(($) => $.auth.actions.submitting)}
        footer={t(($) => $.auth.admin.no_recovery)}
      />
    </main>
  );
};

export default LoginPage;
