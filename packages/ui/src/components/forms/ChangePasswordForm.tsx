import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import {
  type PasswordChangeFormValues,
  PasswordChangeSchema,
} from "./validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "i18n";
import { TranslatedError } from "../TranslatedError";
import { NavLink } from "react-router-dom";
import { Button } from "../ui/button";
import PasswordInput from "../PasswordInput";

interface ChangePasswordFormProps {
  onSubmit: (values: PasswordChangeFormValues) => void | Promise<void>;
  isLoading?: boolean;
}

const ChangePasswordForm = ({
  onSubmit,
  isLoading,
}: ChangePasswordFormProps) => {
  const { t } = useTranslation(["auth"]);

  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(PasswordChangeSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <div className="flex flex-col w-full items-center justify-center px-6 py-10 sm:px-12">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-5 max-w-sm"
        >
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  {t(($) => $.auth.form.current_password_label)}
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    isLoading={isLoading}
                    field={field}
                    placeholder={t(
                      ($) => $.auth.form.current_password_placeholder,
                    )}
                    autoComplete="current-password"
                  />
                </FormControl>
                {fieldState?.error?.message && (
                  <TranslatedError message={fieldState.error?.message} />
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>{t(($) => $.auth.form.password_label)}</FormLabel>
                <FormControl>
                  <PasswordInput
                    isLoading={isLoading}
                    field={field}
                    placeholder={t(($) => $.auth.form.password_placeholder)}
                    autoComplete="new-password"
                  />
                </FormControl>
                {fieldState?.error?.message && (
                  <TranslatedError message={fieldState.error?.message} />
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
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
                {fieldState?.error?.message && (
                  <TranslatedError message={fieldState.error?.message} />
                )}
              </FormItem>
            )}
          />

          <div className="flex gap-x-2">
            <NavLink
              className="w-full cursor-pointer bg-avk-blue-light text-black hover:bg-avk-blue-light/80 flex items-center justify-center rounded-md text-sm font-semibold"
              to="/"
            >
              {t(($) => $.auth.actions.cancel)}
            </NavLink>

            <Button
              className="w-full cursor-pointer bg-avk-blue text-white disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              {isLoading
                ? t(($) => $.auth.actions.saving)
                : t(($) => $.auth.actions.save)}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ChangePasswordForm;
