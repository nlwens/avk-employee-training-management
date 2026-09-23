import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "i18n";

import { Button } from "ui/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "ui/components/ui/form";
import PasswordInput from "ui/components/PasswordInput";
import { TranslatedError } from "ui/components/TranslatedError";
import {
  type NewPasswordFormValues,
  NewPasswordSchema,
} from "@ui/components/forms/validators";

export type UserActivationFormValues = NewPasswordFormValues;

interface UserActivationFormProps {
  onSubmit: (values: UserActivationFormValues) => void | Promise<void>;
  isLoading?: boolean;
}

export const UserActivationForm = ({
  onSubmit,
  isLoading = false,
}: UserActivationFormProps) => {
  const { t } = useTranslation(["auth"]);

  const form = useForm<UserActivationFormValues>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-5 [&_input]:h-11 [&_input]:text-base [&_input]:md:text-base [&_p]:text-base"
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-base">
                {t(($) => $.auth.form.password_label)}
              </FormLabel>
              <FormControl>
                <PasswordInput
                  isLoading={isLoading}
                  field={field}
                  placeholder={t(($) => $.auth.form.password_placeholder)}
                  autoComplete="new-password"
                />
              </FormControl>
              {fieldState.error?.message && (
                <TranslatedError message={fieldState.error.message} />
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-base">
                {t(($) => $.auth.form.confirm_password_label)}
              </FormLabel>
              <FormControl>
                <PasswordInput
                  isLoading={isLoading}
                  field={field}
                  placeholder={t(
                    ($) => $.auth.form.confirm_password_placeholder,
                  )}
                  autoComplete="new-password"
                />
              </FormControl>
              {fieldState.error?.message && (
                <TranslatedError message={fieldState.error.message} />
              )}
            </FormItem>
          )}
        />

        <Button
          className="h-11 w-full cursor-pointer bg-avk-blue text-base font-semibold text-white disabled:cursor-not-allowed"
          type="submit"
          disabled={isLoading}
        >
          {isLoading
            ? t(($) => $.auth.activation.actions.submitting)
            : t(($) => $.auth.activation.actions.submit)}
        </Button>
      </form>
    </Form>
  );
};

export default UserActivationForm;
