import { type PasswordChangeFormValues } from "@ui/components/forms/validators";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import ChangePasswordForm from "@ui/components/forms/ChangePasswordForm";
import { useChangePassword, useHandleApiError, type ApiError } from "@api/src";
import { useToast } from "@ui/hooks/use-toast";
import { useTranslation } from "i18n";
import { useAuth } from "@auth-context/src/auth.context";

const SettingsPage = () => {
  const { logout } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation(["auth", "errors", "common"]);

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
    <DashboardLayout>
      <section className="pb-10">
        <h2 className="mt-10 text-center text-3xl font-medium">
          {t(($) => $.auth.form.change_password)}
        </h2>

        <ChangePasswordForm onSubmit={onSubmit} isLoading={isPending} />
      </section>
    </DashboardLayout>
  );
};

export default SettingsPage;
