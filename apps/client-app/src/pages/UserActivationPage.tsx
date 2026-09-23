import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  QueryBoundary,
  useActivateUser,
  useHandleApiError,
  userActivationQueryOptions,
  type ApiError,
} from "@api/src";
import { dateFormatParams, useTranslation } from "i18n";
import { useToast } from "ui/hooks/use-toast";
import {
  UserActivationForm,
  type UserActivationFormValues,
} from "../components/user-activation/UserActivationForm";

const LOGIN_PATH = "/login";

const UserActivationContent = () => {
  const { code = "" } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation(["auth"]);
  const { handleApiError } = useHandleApiError();

  const { data: activation } = useSuspenseQuery(
    userActivationQueryOptions(code),
  );

  const { mutate: activateUser, isPending } = useActivateUser();

  const redirectToLogin = () => {
    navigate(LOGIN_PATH, { replace: true });
  };

  const handleActivationError = (error: ApiError) => {
    handleApiError(error, {
      onNotFound: redirectToLogin,
      messages: {
        notFound: t(($) => $.auth.activation.messages.error.invalid_link),
      },
    });
  };

  const handleActivationSuccess = () => {
    toast({
      variant: "success",
      description: t(($) => $.auth.activation.messages.success.activated),
    });
    redirectToLogin();
  };

  const onSubmit = ({ password }: UserActivationFormValues) => {
    activateUser(
      { code, password },
      {
        onError: handleActivationError,
        onSuccess: handleActivationSuccess,
      },
    );
  };

  return (
    <main className="flex h-dvh w-full items-center justify-center bg-white px-6 py-10 sm:px-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-3 text-center">
          <h1 className="text-[24px] font-bold text-brand-gray-900">
            {t(($) => $.auth.activation.page.title)}
          </h1>

          <p className="text-base leading-7 text-gray-500">
            {t(($) => $.auth.activation.page.description)}
          </p>
        </div>

        <p className="rounded-md bg-brand-gray-700 px-4 py-3 text-center text-base font-medium leading-7 text-avk-blue">
          {t(($) => $.auth.activation.page.expires_at, {
            date: new Date(activation.expiresAt),
            formatParams: dateFormatParams({
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          })}
        </p>

        <UserActivationForm onSubmit={onSubmit} isLoading={isPending} />
      </div>
    </main>
  );
};

const UserActivationPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["auth"]);

  const redirectToLogin = () => {
    navigate(LOGIN_PATH, { replace: true });
  };

  return (
    <QueryBoundary
      onNotFound={redirectToLogin}
      messages={{
        notFound: t(($) => $.auth.activation.messages.error.invalid_link),
      }}
      errorMessage={t(($) => $.auth.activation.messages.error.loading)}
    >
      <UserActivationContent />
    </QueryBoundary>
  );
};

export default UserActivationPage;
