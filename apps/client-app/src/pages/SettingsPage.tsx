import { useChangePassword, useHandleApiError, type ApiError } from "@api/src";
import { useToast } from "@ui/hooks/use-toast";
import { useTranslation } from "i18n";
import { useAuth } from "@auth-context/src/auth.context";
import ChangePasswordForm from "@ui/components/forms/ChangePasswordForm";
import { type PasswordChangeFormValues } from "@ui/components/forms/validators";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navigation/Navbar";

const SettingsPage = () => {
  const { logout } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation(["auth", "errors", "common"]);
  const navigate = useNavigate();

  const { handleApiError } = useHandleApiError();
  const { mutate: changePassword, isPending } = useChangePassword();

  const onSubmit = async (values: PasswordChangeFormValues) => {
    changePassword(
      {
        currentPassword: values.currentPassword,
        password: values.password,
      },
      {
        onSuccess: () => {
          toast({
            variant: "success",
            title: t(($) => $.common.status.success),
            description: t(($) => $.auth.messages.success.password_changed),
          });

          logout();
          navigate("/login");
        },
        onError: (error: ApiError) =>
          handleApiError(error, {
            messages: {
              forbidden: t(($) => $.auth.messages.error.incorrect_password),
              unexpectedError: t(($) => $.errors.unexpected),
            },
          }),
      },
    );
  };

  return (
    <div className="relative flex min-h-dvh flex-col">
      <Navbar />
      <section className="flex w-full flex-1 flex-col items-center justify-center px-6 py-10 sm:px-12">
        <h4 className="mt-10 text-center text-2xl font-medium">
          {t(($) => $.auth.form.change_password)}
        </h4>

        <ChangePasswordForm onSubmit={onSubmit} isLoading={isPending} />
      </section>
    </div>
  );
};

export default SettingsPage;
